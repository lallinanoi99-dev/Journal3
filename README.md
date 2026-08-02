# Journal3

> A daily journaling mini-dApp on BOT Chain. Log your mood, write your thoughts, attach a photo, and optionally mint your entries as NFTs. Built for the **Girl Meets Tech · BOTChain Build Week Hackathon**.

## Overview

Journal3 takes the concept of a personal journal (like Apple Journal) and puts it permanently on-chain. It focuses on a rock-solid core user flow:
- Connect MetaMask
- Log your mood on a 1-5 scale (Unpleasant ↔ Pleasant)
- Write your thoughts (stored completely **on-chain** as a string)
- Optionally upload a photo (stored via **IPFS** to keep gas costs reasonable)
- Mint your entry as an ERC-721 NFT (1-to-1) if you want a special memory preserved as a token.

### Design Decisions & Hackathon Requirements
- **Text on-chain**: The journal text is written to the blockchain in the `Entry` struct. You can verify the data on the BOT Chain explorer.
- **Images on IPFS**: Binary image data is prohibitively expensive to store on-chain. We use Pinata to upload the image to IPFS and store only the CID/URL on-chain.
- **Soft-delete**: Blockchains are immutable. Deleting an entry sets an `isDeleted` flag, hiding it in the UI, but it remains permanently in the chain's history.
- **Remix-first deployment**: The contract is a single `Journal3.sol` file importing OpenZeppelin via GitHub URL, designed for easy deployment via Remix IDE.

## Tech Stack
- **Smart Contract**: Solidity `^0.8.20`, OpenZeppelin ERC721URIStorage
- **Frontend**: Plain HTML / CSS / JS, no build step required (can be hosted on GitHub Pages)
- **Web3 Interaction**: ethers.js v6
- **Storage**: BOT Chain (Text) + IPFS via Pinata (Images & NFT Metadata)
- **Design System**: Anthropic-inspired light mode, custom CSS properties, glassmorphism, Google Fonts (Playfair Display & Inter)

