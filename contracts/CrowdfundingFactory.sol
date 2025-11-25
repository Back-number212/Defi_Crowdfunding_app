// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {Crowdfunding} from "./Crowdfunding.sol";

/**
 * @title CrowdfundingFactory
 * @author Nguyen Khoa Quang Duy
 * @notice Hợp đồng này hoạt động như một "nhà máy", chịu trách nhiệm tạo và quản lý các chiến dịch gây quỹ.
 */
contract CrowdfundingFactory {
    address public immutable owner;
    bool public paused;

    struct CampaignInfo {
        address campaignAddress;
        address owner;
        string name;
        string image; 
        uint256 creationTime;
        Crowdfunding.Category category; 
    }

    CampaignInfo[] public allCampaigns;
    mapping(address => address[]) public userCampaigns;
    
    // Mapping để lập chỉ mục các chiến dịch theo danh mục
    mapping(Crowdfunding.Category => uint[]) private categoryCampaignIndexes;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    modifier notPaused() {
        require(!paused, "Factory is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Tạo một chiến dịch mới.
     */
    function createCampaign(
        string memory _name,
        string memory _description,
        string memory _image, // Tham số cho IPFS CID
        uint256 _goalInWei,   // Nhận giá trị Wei trực tiếp
        uint256 _durationInDays,
        Crowdfunding.Category _category
    ) external notPaused {
        Crowdfunding newCampaign = new Crowdfunding(
            msg.sender,
            _name,
            _description,
            _image,      
            _goalInWei,  
            _durationInDays,
            _category
        );
        address campaignAddress = address(newCampaign);

        CampaignInfo memory campaignInfo = CampaignInfo({
            campaignAddress: campaignAddress,
            owner: msg.sender,
            name: _name,
            image: _image, 
            creationTime: block.timestamp,
            category: _category
        });

        // Thêm chiến dịch mới vào mảng chính
        allCampaigns.push(campaignInfo);
        
        // Lấy index của chiến dịch vừa được thêm vào
        uint newCampaignIndex = allCampaigns.length - 1;

        // Lưu địa chỉ chiến dịch cho người dùng đã tạo
        userCampaigns[msg.sender].push(campaignAddress);
        
        // Lưu index vào mapping danh mục để lọc nhanh
        categoryCampaignIndexes[_category].push(newCampaignIndex);
    }

    /**
     * @notice Lấy danh sách các chiến dịch theo một danh mục cụ thể.
     */
    function getCampaignsByCategory(Crowdfunding.Category _category) external view returns (CampaignInfo[] memory) {
        uint[] memory indexes = categoryCampaignIndexes[_category];
        CampaignInfo[] memory result = new CampaignInfo[](indexes.length);

        for (uint i = 0; i < indexes.length; i++) {
            result[i] = allCampaigns[indexes[i]];
        }

        return result;
    }

    /**
     * @notice Lấy danh sách địa chỉ các chiến dịch do một người dùng cụ thể tạo.
     */
    function getUserCampaigns(address _user) external view returns (address[] memory) {
        return userCampaigns[_user];
    }

    /**
     * @notice Lấy thông tin tất cả các chiến dịch đã được tạo.
     */
    function getAllCampaigns() external view returns (CampaignInfo[] memory) {
        return allCampaigns;
    }

    function Pause() external onlyOwner {
        paused = !paused;
    }
}