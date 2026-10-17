// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Campus Lost-and-Found Claim Registry
/// @notice Records found items and coordinates transparent return claims.
/// @dev Do not store names, phone numbers, IDs, or other sensitive data on-chain.
contract CampusLostAndFound {
    address public immutable administrator;
    string public constant applicationName = "Campus Lost-and-Found Claim Registry";
    uint256 public itemCount;

    enum ItemStatus {
        Available,
        ClaimPending,
        Returned,
        Closed
    }

    struct FoundItem {
        uint256 id;
        address reporter;
        string itemName;
        string description;
        string foundLocation;
        uint256 reportedAt;
        ItemStatus status;
        address claimant;
        string claimReference;
    }

    mapping(uint256 => FoundItem) private items;

    event ItemReported(
        uint256 indexed itemId,
        address indexed reporter,
        string itemName,
        string foundLocation
    );
    event ClaimRequested(
        uint256 indexed itemId,
        address indexed claimant,
        string claimReference
    );
    event ClaimReviewed(
        uint256 indexed itemId,
        address indexed reporter,
        address indexed claimant,
        bool approved
    );
    event ItemClosed(uint256 indexed itemId, address indexed administrator);

    modifier validItem(uint256 itemId) {
        require(itemId > 0 && itemId <= itemCount, "Item does not exist");
        _;
    }

    modifier onlyAdministrator() {
        require(msg.sender == administrator, "Administrator only");
        _;
    }

    constructor() {
        administrator = msg.sender;
    }

    /// @notice Report a found item without publishing sensitive personal information.
    function reportItem(
        string calldata itemName,
        string calldata description,
        string calldata foundLocation
    ) external returns (uint256 itemId) {
        uint256 nameLength = bytes(itemName).length;
        uint256 descriptionLength = bytes(description).length;
        uint256 locationLength = bytes(foundLocation).length;

        require(nameLength >= 3 && nameLength <= 80, "Item name must be 3-80 characters");
        require(
            descriptionLength >= 5 && descriptionLength <= 300,
            "Description must be 5-300 characters"
        );
        require(
            locationLength >= 3 && locationLength <= 120,
            "Location must be 3-120 characters"
        );

        itemId = ++itemCount;
        items[itemId] = FoundItem({
            id: itemId,
            reporter: msg.sender,
            itemName: itemName,
            description: description,
            foundLocation: foundLocation,
            reportedAt: block.timestamp,
            status: ItemStatus.Available,
            claimant: address(0),
            claimReference: ""
        });

        emit ItemReported(itemId, msg.sender, itemName, foundLocation);
    }

    /// @notice Ask the reporter to return an available item.
    /// @param claimReference A non-sensitive proof reference agreed off-chain.
    function requestClaim(
        uint256 itemId,
        string calldata claimReference
    ) external validItem(itemId) {
        FoundItem storage item = items[itemId];
        uint256 referenceLength = bytes(claimReference).length;

        require(item.status == ItemStatus.Available, "Item is not available");
        require(msg.sender != item.reporter, "Reporter cannot claim own item");
        require(
            referenceLength >= 3 && referenceLength <= 120,
            "Claim reference must be 3-120 characters"
        );

        item.status = ItemStatus.ClaimPending;
        item.claimant = msg.sender;
        item.claimReference = claimReference;

        emit ClaimRequested(itemId, msg.sender, claimReference);
    }

    /// @notice Approve or reject the current claim. Only the original reporter may decide.
    function reviewClaim(
        uint256 itemId,
        bool approved
    ) external validItem(itemId) {
        FoundItem storage item = items[itemId];

        require(msg.sender == item.reporter, "Only the reporter can review");
        require(item.status == ItemStatus.ClaimPending, "No pending claim");

        address reviewedClaimant = item.claimant;
        if (approved) {
            item.status = ItemStatus.Returned;
        } else {
            item.status = ItemStatus.Available;
            item.claimant = address(0);
            item.claimReference = "";
        }

        emit ClaimReviewed(itemId, msg.sender, reviewedClaimant, approved);
    }

    /// @notice Close an unclaimed listing. This deliberately demonstrates admin authorization.
    function closeItem(
        uint256 itemId
    ) external onlyAdministrator validItem(itemId) {
        FoundItem storage item = items[itemId];
        require(item.status == ItemStatus.Available, "Only available items can be closed");

        item.status = ItemStatus.Closed;
        emit ItemClosed(itemId, msg.sender);
    }

    function getItem(
        uint256 itemId
    ) external view validItem(itemId) returns (FoundItem memory) {
        return items[itemId];
    }
}
