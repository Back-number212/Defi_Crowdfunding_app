// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CrowdFundingPlatform
 * @author Nguyen Khoa Quang Duy
 * @notice Hợp đồng đơn khối quản lý toàn bộ nền tảng gây quỹ.
 * @dev Tích hợp đầy đủ: IPFS image, Wei unit, Manual Stop, Remove Tier, Anti-Reentrancy.
 */
contract CrowdFundingPlatform {
    // === Events (Sự kiện) ===
    event CampaignCreated(uint256 indexed campaignId, address indexed owner, string title, uint256 target, uint256 deadline);
    event Donated(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event FundsClaimed(uint256 indexed campaignId, address owner, uint256 amountClaimed);
    event Refunded(uint256 indexed campaignId, address indexed donor, uint256 amountRefunded);
    event CampaignStateChanged(uint256 indexed campaignId, CampaignState newState);

    // === Structs & Enums ===

    enum Category { Art, Technology, Health, Education, Community, Crypto, Other }
    enum CampaignState { Active, Successful, Failed, Claimed }

    struct RewardTier {
        string description;      // Mô tả phần thưởng
        uint256 requiredAmount;  // Số tiền (Wei) để nhận thưởng
    }

    struct Campaign {
        address owner;           // Chủ sở hữu
        string title;            // Tên chiến dịch
        string description;      // Mô tả
        string image;            // Mã CID của ảnh trên IPFS
        uint256 target;          // Mục tiêu (Wei)
        uint256 deadline;        // Thời hạn (Unix timestamp)
        uint256 amountCollected; // Số tiền đã gom được
        Category category;       // Danh mục
        CampaignState state;     // Trạng thái
        RewardTier[] rewardTiers;// Danh sách phần thưởng
    }

    // === State Variables ===

    uint256 public numberOfCampaigns = 0;
    mapping(uint256 => Campaign) public campaigns;
    
    // Lưu số tiền đóng góp của từng người cho từng chiến dịch: [CampaignID][UserAddress] => Amount
    mapping(uint256 => mapping(address => uint256)) public contributions;

    // === Modifiers ===

    modifier onlyOwner(uint256 _id) {
        require(msg.sender == campaigns[_id].owner, "Not the campaign owner");
        _;
    }

    modifier campaignActive(uint256 _id) {
        require(campaigns[_id].state == CampaignState.Active, "Campaign is not active");
        _;
    }

    // === Core Functions ===

    /**
     * @notice Tạo một chiến dịch mới.
     * @param _title Tên chiến dịch.
     * @param _image Mã CID của ảnh trên IPFS.
     * @param _targetInWei Mục tiêu tính bằng WEI.
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _image,
        uint256 _targetInWei,
        uint256 _durationInDays,
        Category _category
    ) public returns (uint256) {
        require(_targetInWei > 0, "Target must be > 0");

        uint256 campaignId = numberOfCampaigns;
        Campaign storage newCampaign = campaigns[campaignId];

        newCampaign.owner = msg.sender;
        newCampaign.title = _title;
        newCampaign.description = _description;
        newCampaign.image = _image;
        newCampaign.target = _targetInWei;
        newCampaign.deadline = block.timestamp + (_durationInDays * 1 days);
        newCampaign.category = _category;
        newCampaign.state = CampaignState.Active;
        newCampaign.amountCollected = 0;

        numberOfCampaigns++;

        emit CampaignCreated(campaignId, msg.sender, _title, _targetInWei, newCampaign.deadline);
        return campaignId;
    }

    /**
     * @notice Thêm mốc phần thưởng cho chiến dịch.
     */
    function addRewardTier(uint256 _id, string memory _desc, uint256 _amountInWei) public onlyOwner(_id) campaignActive(_id) {
        campaigns[_id].rewardTiers.push(RewardTier(_desc, _amountInWei));
    }

    /**
     * @notice Xóa mốc phần thưởng (chỉ khi chưa có ai quyên góp).
     */
    function removeRewardTier(uint256 _id, uint256 _index) public onlyOwner(_id) campaignActive(_id) {
        Campaign storage campaign = campaigns[_id];
        require(_index < campaign.rewardTiers.length, "Invalid index");
        require(campaign.amountCollected == 0, "Cannot remove tiers after funding started");

        campaign.rewardTiers[_index] = campaign.rewardTiers[campaign.rewardTiers.length - 1];
        campaign.rewardTiers.pop();
    }

    /**
     * @notice Quyên góp tiền cho chiến dịch.
     */
    function donateToCampaign(uint256 _id) public payable campaignActive(_id) {
        require(msg.value > 0, "Donation must be > 0");

        Campaign storage campaign = campaigns[_id];
        
        campaign.amountCollected += msg.value;
        contributions[_id][msg.sender] += msg.value;

        emit Donated(_id, msg.sender, msg.value);

        _checkAndUpdateState(_id);
    }

    /**
     * @notice Kiểm tra và cập nhật trạng thái tự động (Internal).
     */
    function _checkAndUpdateState(uint256 _id) internal {
        Campaign storage campaign = campaigns[_id];
        
        if (campaign.state == CampaignState.Active) {
            if (campaign.amountCollected >= campaign.target) {
                campaign.state = CampaignState.Successful;
                emit CampaignStateChanged(_id, CampaignState.Successful);
            } else if (block.timestamp >= campaign.deadline) {
                campaign.state = CampaignState.Failed;
                emit CampaignStateChanged(_id, CampaignState.Failed);
            }
        }
    }

    /**
     * @notice Rút tiền khi chiến dịch thành công.
     */
    function claimFunds(uint256 _id) public onlyOwner(_id) {
        _checkAndUpdateState(_id); // Kiểm tra lại lần cuối
        Campaign storage campaign = campaigns[_id];

        require(campaign.state == CampaignState.Successful, "Campaign not successful");
        
        uint256 amount = campaign.amountCollected;
        campaign.state = CampaignState.Claimed; // Đổi trạng thái để tránh rút nhiều lần
        campaign.amountCollected = 0; // Reset số dư để an toàn

        (bool sent, ) = payable(campaign.owner).call{value: amount}("");
        require(sent, "Failed to send funds");

        emit FundsClaimed(_id, campaign.owner, amount);
    }

    /**
     * @notice Hoàn tiền cho nhà đầu tư khi chiến dịch thất bại.
     */
    function getRefund(uint256 _id) public {
        _checkAndUpdateState(_id);
        Campaign storage campaign = campaigns[_id];

        require(campaign.state == CampaignState.Failed, "Refunds not available");
        
        uint256 amount = contributions[_id][msg.sender];
        require(amount > 0, "Nothing to refund");

        // Reset số dư TRƯỚC KHI gửi tiền (Chống Re-entrancy)
        contributions[_id][msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to refund");

        emit Refunded(_id, msg.sender, amount);
    }

    /**
     * @notice Dừng chiến dịch thủ công (Khẩn cấp/Kết thúc sớm).
     */
    function manualStopCampaign(uint256 _id) public onlyOwner(_id) campaignActive(_id) {
        Campaign storage campaign = campaigns[_id];
        
        if (campaign.amountCollected >= campaign.target) {
            campaign.state = CampaignState.Successful;
        } else {
            campaign.state = CampaignState.Failed;
        }

        emit CampaignStateChanged(_id, campaign.state);
    }

    // === View Functions ===

    /**
     * @notice Lấy danh sách tất cả các chiến dịch trên hệ thống.
     * @dev Hàm này trả về mảng chứa toàn bộ thông tin các chiến dịch.
     */
    function getAllCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        for(uint i = 0; i < numberOfCampaigns; i++) {
            Campaign storage item = campaigns[i];
            allCampaigns[i] = item;
        }

        return allCampaigns;
    }

    /**
     * @notice Lấy danh sách các chiến dịch theo danh mục.
     * @dev Giúp frontend (Thirdweb) lọc nhanh mà không cần tải tất cả về.
     */
    function getCampaignsByCategory(Category _category) public view returns (Campaign[] memory) {
        uint256 count = 0;
        // Bước 1: Đếm số lượng chiến dịch thuộc danh mục này
        for(uint256 i = 0; i < numberOfCampaigns; i++) {
            if(campaigns[i].category == _category) {
                count++;
            }
        }

        // Bước 2: Tạo mảng kết quả với kích thước chính xác
        Campaign[] memory filteredCampaigns = new Campaign[](count);
        uint256 currentIndex = 0;

        // Bước 3: Đinền dữ liệu vào mảng
        for(uint256 i = 0; i < numberOfCampaigns; i++) {
            if(campaigns[i].category == _category) {
                filteredCampaigns[currentIndex] = campaigns[i];
                currentIndex++;
            }
        }

        return filteredCampaigns;
    }

    function getCampaignTiers(uint256 _id) public view returns (RewardTier[] memory) {
        return campaigns[_id].rewardTiers;
    }

    function getUserContribution(uint256 _id, address _user) public view returns (uint256) {
        return contributions[_id][_user];
    }
}