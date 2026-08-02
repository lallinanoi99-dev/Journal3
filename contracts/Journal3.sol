// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─── Remix Import Note ────────────────────────────────────────────────────────
// In Remix IDE, use the npm import below — Remix resolves it automatically.
// If you see a "not found" error, switch to the GitHub URL version:
//
//   import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
//
// Recommended: use Remix v0.36+, compile with Solidity 0.8.20,
// EVM version: paris, Optimizer ON (200 runs).
// ─────────────────────────────────────────────────────────────────────────────
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title  Journal3
 * @author Journal3 — Girl Meets Tech · BOTChain Build Week Hackathon
 * @notice On-chain daily journal with optional ERC-721 NFT minting.
 *
 * Design decisions (match spec exactly):
 *  TEXT is stored on-chain as a string — judges verify via explorer.
 *  Images are stored as IPFS CIDs/URIs only (no binary data on-chain).
 *  "Delete" is SOFT DELETE — sets isDeleted=true; blockchain is immutable.
 *  Only the original author can edit/delete/mint their own entries.
 *  Mood is uint8, scale 1-5 (1=unpleasant/lowest, 5=pleasant/highest).
 *  Each entry can be minted as an ERC-721 NFT exactly once.
 *
 * Deployment checklist (BOT Chain Testnet, Chain ID 968):
 *  1. Open Remix IDE, create a new file, paste this contract.
 *  2. Compile: Solidity 0.8.20, EVM: paris, Optimizer ON (200 runs).
 *  3. Deploy tab => Environment: "Injected Provider - MetaMask".
 *  4. Add BOT Chain Testnet to MetaMask:
 *       Network Name : BOT Chain Testnet (Bohr)
 *       RPC URL      : https://rpc.bohr.life
 *       Chain ID     : 968
 *       Currency     : BOT
 *       Explorer     : https://scan.bohr.life
 *  5. Click Deploy => confirm in MetaMask.
 *  6. Copy the deployed contract address.
 *  7. Paste it into app.js => CONTRACT_ADDRESS constant.
 *  8. Verify on https://scan.bohr.life/address/<YOUR_ADDRESS>
 *
 * For mainnet (Chain ID 677, RPC: https://rpc.botchain.ai), repeat steps 4-8
 * with mainnet details, then update ACTIVE_NETWORK in app.js.
 */
contract Journal3 is ERC721URIStorage {

    // ─── Data Structures ──────────────────────────────────────────────────────

    struct Entry {
        uint256 id;         // Auto-incrementing unique entry ID
        address author;     // Wallet address that created the entry
        string  text;       // Journal body text (stored on-chain)
        uint8   mood;       // Mood score: 1 (unpleasant) to 5 (pleasant)
        string  imageURI;   // IPFS URI for attached photo (empty if none)
        uint256 timestamp;  // block.timestamp at creation time
        bool    isDeleted;  // Soft-delete flag (hidden in UI, not erased)
        bool    isMinted;   // True once mintEntryAsNFT() has been called
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    uint256 private _entryCounter;                           // auto-increment entry IDs
    uint256 private _tokenCounter;                           // auto-increment NFT token IDs
    mapping(uint256 => Entry) private _entries;              // entryId => Entry
    mapping(address => uint256[]) private _authorEntries;   // author => entryId[]

    // ─── Events ───────────────────────────────────────────────────────────────

    event EntryCreated(
        uint256 indexed entryId,
        address indexed author,
        uint8   mood,
        uint256 timestamp
    );

    event EntryEdited(
        uint256 indexed entryId,
        uint8   newMood,
        uint256 timestamp
    );

    event EntryDeleted(
        uint256 indexed entryId,
        uint256 timestamp
    );

    event EntryMinted(
        uint256 indexed entryId,
        uint256 indexed tokenId,
        address indexed author
    );

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() ERC721("Journal3", "J3") {}

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAuthor(uint256 entryId) {
        require(
            _entries[entryId].author == msg.sender,
            "Journal3: not the entry author"
        );
        _;
    }

    modifier notDeleted(uint256 entryId) {
        require(
            !_entries[entryId].isDeleted,
            "Journal3: entry has been deleted"
        );
        _;
    }

    // ─── Write ────────────────────────────────────────────────────────────────

    /**
     * @notice Create a new journal entry on-chain.
     * @param text      The journal body text (stored on-chain, required).
     * @param mood      Mood score from 1 (unpleasant) to 5 (pleasant).
     * @param imageURI  IPFS URI of attached photo, or "" if none.
     * @return entryId  The ID of the newly created entry.
     */
    function writeEntry(
        string memory text,
        uint8         mood,
        string memory imageURI
    ) external returns (uint256 entryId) {
        require(mood >= 1 && mood <= 5, "Journal3: mood must be between 1 and 5");
        require(bytes(text).length > 0,  "Journal3: text cannot be empty");

        entryId = _entryCounter;
        _entryCounter++;

        _entries[entryId] = Entry({
            id:        entryId,
            author:    msg.sender,
            text:      text,
            mood:      mood,
            imageURI:  imageURI,
            timestamp: block.timestamp,
            isDeleted: false,
            isMinted:  false
        });

        _authorEntries[msg.sender].push(entryId);
        emit EntryCreated(entryId, msg.sender, mood, block.timestamp);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    /**
     * @notice Edit an existing journal entry. Only the original author may call.
     * @dev    Updates current on-chain state. Prior state is preserved forever
     *         in transaction history (blockchains are immutable).
     * @param entryId      The ID of the entry to edit.
     * @param newText      Updated journal body text.
     * @param newMood      Updated mood score (1-5).
     * @param newImageURI  Updated IPFS image URI ("" to clear).
     */
    function editEntry(
        uint256       entryId,
        string memory newText,
        uint8         newMood,
        string memory newImageURI
    )
        external
        onlyAuthor(entryId)
        notDeleted(entryId)
    {
        require(newMood >= 1 && newMood <= 5, "Journal3: mood must be between 1 and 5");
        require(bytes(newText).length > 0,    "Journal3: text cannot be empty");

        Entry storage entry = _entries[entryId];
        entry.text     = newText;
        entry.mood     = newMood;
        entry.imageURI = newImageURI;

        emit EntryEdited(entryId, newMood, block.timestamp);
    }

    // ─── Soft Delete ──────────────────────────────────────────────────────────

    /**
     * @notice Soft-delete a journal entry. Only the original author may call.
     * @dev    Sets isDeleted=true. Entry data is PERMANENTLY recorded on-chain
     *         and cannot be truly erased. Frontend filters deleted entries and
     *         shows users a disclaimer about blockchain immutability.
     * @param entryId  The ID of the entry to soft-delete.
     */
    function deleteEntry(uint256 entryId)
        external
        onlyAuthor(entryId)
        notDeleted(entryId)
    {
        _entries[entryId].isDeleted = true;
        emit EntryDeleted(entryId, block.timestamp);
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    /**
     * @notice Return all non-deleted entries authored by the calling wallet.
     * @return result  Array of Entry structs for msg.sender (active only).
     */
    function getMyEntries() external view returns (Entry[] memory result) {
        uint256[] storage ids = _authorEntries[msg.sender];
        uint256 activeCount = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            if (!_entries[ids[i]].isDeleted) activeCount++;
        }

        result = new Entry[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!_entries[ids[i]].isDeleted) {
                result[idx] = _entries[ids[i]];
                idx++;
            }
        }
    }

    /**
     * @notice Return a single entry by ID (regardless of deleted status).
     */
    function getEntry(uint256 entryId) external view returns (Entry memory) {
        return _entries[entryId];
    }

    // ─── Mint as NFT ──────────────────────────────────────────────────────────

    /**
     * @notice Mint a journal entry as an ERC-721 NFT. One mint per entry max.
     * @dev    tokenURI_ should be an IPFS URI pointing to JSON metadata:
     *         { name, description, image, attributes: [{ mood, date }] }
     *         The frontend constructs and uploads this JSON via Pinata.
     * @param entryId   The ID of the journal entry to mint.
     * @param tokenURI_ IPFS URI of the NFT metadata JSON.
     * @return tokenId  The minted ERC-721 token ID.
     */
    function mintEntryAsNFT(
        uint256       entryId,
        string memory tokenURI_
    )
        external
        onlyAuthor(entryId)
        notDeleted(entryId)
        returns (uint256 tokenId)
    {
        require(!_entries[entryId].isMinted, "Journal3: entry already minted as NFT");

        tokenId = _tokenCounter;
        _tokenCounter++;

        _entries[entryId].isMinted = true;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        emit EntryMinted(entryId, tokenId, msg.sender);
    }

    // ─── View Helpers ─────────────────────────────────────────────────────────

    /// @notice Total entries ever created (including soft-deleted).
    function totalEntries() external view returns (uint256) { return _entryCounter; }

    /// @notice Total ERC-721 tokens minted via mintEntryAsNFT.
    function totalMinted() external view returns (uint256) { return _tokenCounter; }
}
