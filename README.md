# Defi_Crowdfunding_app
# 🚀 Decentralized Crowdfunding Application (DeFi Crowdfunding App)

A Full-Stack Decentralized Crowdfunding (DeFi) Platform built on Blockchain technology. This application eliminates traditional intermediaries, ensuring transparency, security, and automated financial handlings through smart contracts.

This project was researched and implemented as a **Graduation Thesis**.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Architecture Overview](#-architecture-overview)
3. [Tech Stack](#-tech-stack)
4. [Smart Contract Workflows](#-smart-contract-workflows)
5. [Database Design (Off-chain)](#-database-design-off-chain)

---

## 🌟 Key Features

* **Decentralized Campaigns**: Users can seamlessly create crowdfunding campaigns directly on the blockchain with specified funding goals and deadlines.
* **Transparent Donations**: Direct wallet-to-contract transactions ensuring every single contribution is immutable, public, and secure.
* **Automated Fund Claiming**: Campaign creators can safely withdraw/claim the raised funds only if the targeted campaign goal is successfully achieved.
* **Guaranteed Refunds**: Automatically protects backers by enabling a built-in refund mechanism if a campaign fails to hit its funding threshold before expiration.
* **Hybrid Storage Architecture**: Optimizes gas fees by combining on-chain execution with rapid off-chain data querying.

---

## 🏗 Architecture Overview

The application follows a secure hybrid dApp architecture to achieve high scalability and optimize gas efficiency:
* **On-Chain (Blockchain)**: Handles all financial assets, core logic, campaign creation state, donation records, and payout/refund rules via Smart Contracts.
* **Off-Chain (Database & Backend)**: Manages non-critical relational data, historical indexing, and rich media assets (images, descriptions) to reduce execution load on the mainnet.

---

## 💻 Tech Stack

### Smart Contract & Blockchain
* **Language**: Solidity
* **Development Framework**: Thirdweb
* **Execution Network**: EVM-Compatible Blockchain

### Frontend Web App
* **Framework**: React.js / Next.js
* **Blockchain Client Interaction**: Thirdweb SDK & Ethers.js
* **Styling**: Tailwind CSS

### Backend & Off-chain Database
* **Platform**: Supabase (PostgreSQL database & Storage Buckets)

  <img width="1019" height="909" alt="image" src="https://github.com/user-attachments/assets/18c0c248-dfc8-49c1-b5f5-a047871ca193" />


---

## 📜 Smart Contract Workflows

The platform's business logic is strictly enforced by cryptographic smart contracts written in Solidity:

1. **Campaign Creation**: Initializes a campaign state struct containing the owner's address, specific funding target, expiration timestamp, and total accumulated amount.
2. **Donation Processing**: Tracks sender addresses and updates internal mapping arrays while safely locking the incoming crypto assets into the contract instance.
3. **Condition Auditing**:
   * *Success State*: Target met $\rightarrow$ Allows owner to call the execution function to release assets.
   * *Failure State*: Target missed + Time expired $\rightarrow$ Activates user-triggered pull-payments for individual backer refunds.
     
<img width="1356" height="812" alt="image" src="https://github.com/user-attachments/assets/29348cbb-4f86-428b-a2ce-f4b43cb35ec1" />

---

## 🗄 Database Design (Off-chain)

Supabase handles relational entity models that correspond to on-chain tracking:
* **`Profiles / Users`**: Stores off-chain metrics, display names, and registered wallet public keys.
* **`Campaigns_Metadata`**: Stores heavy media payloads, rich text bios, and categories mapped to their corresponding on-chain `campaign_id`.

---



### 1. Smart Contract Deployment
Navigate to your contracts directory, configure your environmental deployments, and ship via Thirdweb CLI:
```bash
npx thirdweb deploy
