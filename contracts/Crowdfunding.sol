// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CrowdFundingPlatform {
    // === Constants (Hằng số) ===
    address public constant PLATFORM_FEE_ADDRESS = 0xa2e9A589710c0aDf6B834a0df1f2572B47A253f5;
    uint256 public constant PLATFORM_FEE_PERCENT = 2; // Phí 2%

    // === Events ===
    event CampaignCreated(uint256 indexed campaignId, address indexed owner, string title, uint256 target, uint256 deadline);
    event Donated(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event FundsClaimed(uint256 indexed campaignId, address owner, uint256 amountClaimed, uint256 feePaid);
    event Refunded(uint256 indexed campaignId, address indexed donor, uint256 amountRefunded);
    event CampaignStateChanged(uint256 indexed campaignId, CampaignState newState);
    event RewardGranted(uint256 indexed campaignId, address indexed backer, uint256 tierIndex, string rewardName);

    // === Structs & Enums ===
    enum Category { Art, Technology, Health, Education, Community, Crypto, Other }
    enum CampaignState { Active, Successful, Failed, Claimed }

    struct RewardTier {
        string description;      
        uint256 requiredAmount; 
    }

    struct Campaign {
        address owner;           
        string title;            
        string description;      
        string image;            
        uint256 target;          
        uint256 deadline;        
        uint256 amountCollected; 
        Category category;       
        CampaignState state;     
        RewardTier[] rewardTiers;
    }

    // === State Variables ===
    uint256 public numberOfCampaigns = 0;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public backerRewardBalances;

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

    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _image,
        uint256 _targetInWei,
        uint256 _durationInDays,
        Category _category,
        string[] memory _tierNames,      
        uint256[] memory _tierAmounts    
    ) public returns (uint256) {
        require(_targetInWei > 0, "Target must be > 0");
        require(_tierNames.length == _tierAmounts.length, "Tiers data mismatch");

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

        for (uint256 i = 0; i < _tierNames.length; i++) {
            newCampaign.rewardTiers.push(RewardTier({
                description: _tierNames[i],
                requiredAmount: _tierAmounts[i]
            }));
        }

        numberOfCampaigns++;

        emit CampaignCreated(campaignId, msg.sender, _title, _targetInWei, newCampaign.deadline);
        return campaignId;
    }

    function addRewardTier(uint256 _id, string memory _desc, uint256 _amountInWei) public onlyOwner(_id) campaignActive(_id) {
        campaigns[_id].rewardTiers.push(RewardTier(_desc, _amountInWei));
    }

    function removeRewardTier(uint256 _id, uint256 _index) public onlyOwner(_id) campaignActive(_id) {
        Campaign storage campaign = campaigns[_id];
        require(_index < campaign.rewardTiers.length, "Invalid index");
        require(campaign.amountCollected == 0, "Cannot remove tiers after funding started");

        campaign.rewardTiers[_index] = campaign.rewardTiers[campaign.rewardTiers.length - 1];
        campaign.rewardTiers.pop();
    }

    function donateToCampaign(uint256 _id) public payable campaignActive(_id) {
        require(msg.value > 0, "Donation must be > 0");
        
        Campaign storage campaign = campaigns[_id];
        campaign.amountCollected += msg.value;
        contributions[_id][msg.sender] += msg.value;

        int256 highestEligibleTierIndex = -1; 
        uint256 highestAmount = 0;

        for (uint256 i = 0; i < campaign.rewardTiers.length; i++) {
            uint256 required = campaign.rewardTiers[i].requiredAmount;
            if (msg.value >= required && required >= highestAmount) {
                highestEligibleTierIndex = int256(i);
                highestAmount = required;
            }
        }

        if (highestEligibleTierIndex != -1) {
            uint256 tierIndex = uint256(highestEligibleTierIndex);
            backerRewardBalances[_id][msg.sender][tierIndex] += 1;
            emit RewardGranted(_id, msg.sender, tierIndex, campaign.rewardTiers[tierIndex].description);
        }

        emit Donated(_id, msg.sender, msg.value);
        _checkAndUpdateState(_id);
    }

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
        _checkAndUpdateState(_id); 
        Campaign storage campaign = campaigns[_id];
        require(campaign.state == CampaignState.Successful, "Campaign not successful");
        
        uint256 totalAmount = campaign.amountCollected;
        require(totalAmount > 0, "No funds to claim");

        campaign.state = CampaignState.Claimed;
        campaign.amountCollected = 0;

        // Tính toán phí 2%
        uint256 fee = (totalAmount * PLATFORM_FEE_PERCENT) / 100;
        uint256 amountToOwner = totalAmount - fee;

        // 1. Chuyển 98% cho chủ dự án
        (bool sentOwner, ) = payable(campaign.owner).call{value: amountToOwner}("");
        require(sentOwner, "Failed to send funds to campaign owner");

        // 2. Chuyển 2% phí về ví chủ hợp đồng
        if (fee > 0) {
            (bool sentFee, ) = payable(PLATFORM_FEE_ADDRESS).call{value: fee}("");
            require(sentFee, "Failed to send fee to platform");
        }

        emit FundsClaimed(_id, campaign.owner, totalAmount, fee);
    }

    function getRefund(uint256 _id) public {
        _checkAndUpdateState(_id);
        Campaign storage campaign = campaigns[_id];

        require(campaign.state == CampaignState.Failed, "Refunds not available");
        
        uint256 amount = contributions[_id][msg.sender];
        require(amount > 0, "Nothing to refund");

        contributions[_id][msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to refund");

        emit Refunded(_id, msg.sender, amount);
    }

    /**
     * @notice Dừng thủ công
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
    function getAllCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);
        for(uint i = 0; i < numberOfCampaigns; i++) {
            allCampaigns[i] = campaigns[i];
        }
        return allCampaigns;
    }

    function getCampaignsByCategory(Category _category) public view returns (Campaign[] memory) {
        uint256 count = 0;
        for(uint256 i = 0; i < numberOfCampaigns; i++) {
            if(campaigns[i].category == _category) {
                count++;
            }
        }
        Campaign[] memory filteredCampaigns = new Campaign[](count);
        uint256 currentIndex = 0;
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

    function getBackerRewardBalance(uint256 _id, address _backer, uint256 _tierIndex) public view returns (uint256) {
        return backerRewardBalances[_id][_backer][_tierIndex];
    }
}