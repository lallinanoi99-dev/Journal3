# Journal3

<img width="1710" height="981" alt="image" src="https://github.com/user-attachments/assets/59b8d581-daac-4ee4-9d81-6f54f25be153" />


## Overview

Journal3 takes the concept of a personal journal (like Apple Journal) and puts it permanently on-chain. It focuses on a rock-solid core user flow:
- Connect MetaMask / Freighter
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
- **Web3 Interaction**: ethers.js v6 (for BOT Chain), Stellar SDK & Freighter API (for Stellar)
- **Storage**: BOT Chain (Text) + IPFS via Pinata (Images & NFT Metadata)
- **Design System**: Anthropic-inspired light mode, custom CSS properties, glassmorphism, Google Fonts (Playfair Display & Inter)

## Stellar Integration (Hackathon Requirements)
This project implements both BOT Chain (MetaMask) and Stellar (Freighter) support.
- **Wallet Setup**: Integrates `@stellar/freighter-api` to connect the Freighter wallet on the Stellar Testnet.
- **Balance Handling**: Fetches and displays the user's XLM balance directly in the navigation top bar.
- **Transaction Flow**: Includes a dedicated "Stellar" panel where users can send testnet XLM to any address, with transaction signing handled by Freighter and submission handled by Stellar Horizon.

## How to Run & Deploy

### 1. Smart Contract Deployment (Remix)
1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create a new file `Journal3.sol` in the `contracts` folder and paste the contents of `contracts/Journal3.sol`.
3. Compile with Solidity version `0.8.20`, EVM version `paris`, and Optimizer enabled (200 runs).
4. In the Deploy tab, select Environment: **Injected Provider - MetaMask**.
5. Ensure your MetaMask is connected to **BOT Chain Testnet** (Chain ID: `968`, RPC: `https://rpc.bohr.life`).
6. Deploy the `Journal3` contract and confirm the transaction in MetaMask.
7. Copy the deployed **Contract Address**.

### 2. Frontend Setup
1. Open `app.js` in a text editor.
2. Replace `YOUR_CONTRACT_ADDRESS_HERE` with the address you copied from Remix:
   ```javascript
   const CONTRACT_ADDRESS = '0xYourDeployedAddress...';
   ```
3. To test locally, you can serve the directory using any static file server:
   ```bash
   npx serve .
   # or
   python3 -m http.server
   ```
4. Open the local URL (e.g., `http://localhost:3000`) in your browser.
5. In the Journal3 app's **Settings** panel, you can optionally provide a [Pinata JWT](https://pinata.cloud/) to enable IPFS photo uploads.

### 3. Deploying to GitHub Pages
Since the app is pure HTML/CSS/JS, you can host it for free on GitHub Pages:
1. Push this repository to GitHub.
2. Go to your repository **Settings > Pages**.
3. Under **Build and deployment**, set the Source to **Deploy from a branch**.
4. Select the `main` (or `master`) branch and `/ (root)` folder.
6. Click **Save**. Your app will be live at `https://<your-username>.github.io/<repo-name>`.

## Screenshots

As part of the submission requirements, here are the screenshots demonstrating the functionality:

### 1. Wallet Connected State
<img width="1318" height="926" alt="Screenshot 2026-08-21 at 00 38 47" src="https://github.com/user-attachments/assets/3a2d0890-eb39-4d8d-a284-c882412049be" />


### 2. Balance Displayed
<img width="1318" height="926" alt="Screenshot 2026-08-21 at 00 38 47" src="https://github.com/user-attachments/assets/2af1cc3d-0ad4-48a9-9049-3022b81f79c0" />


### 3. Successful Testnet Transaction
<img width="1387" height="521" alt="Screenshot 2026-08-21 at 00 41 51" src="https://github.com/user-attachments/assets/8096d26b-ad33-4f2a-b3b5-34e8871d3d0e" />


### 4. Transaction Result Shown to User
<img width="330" height="118" alt="image" src="https://github.com/user-attachments/assets/6e550312-8043-4dd9-9de2-7ef29b4815c8" />


