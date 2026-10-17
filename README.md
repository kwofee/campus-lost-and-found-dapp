# Campus Lost-and-Found Claim Registry

An original Ethereum DApp for reporting found campus items, requesting a return, and recording whether a claim was approved. The blockchain provides a transparent, tamper-resistant history while the interface warns users not to publish personal information.

## Assignment requirements covered

- Solidity contract with variables, functions, a constructor, events, and validation
- HTML, CSS, and JavaScript frontend
- MetaMask integration with Ethers.js
- State-changing transactions and blockchain-data retrieval
- Valid, invalid, and unauthorised test cases
- Remix IDE deployment to a local Ganache network

## Project structure

```text
CampusLostAndFoundDApp/
|-- contracts/
|   `-- CampusLostAndFound.sol
|-- frontend/
|   |-- index.html
|   |-- style.css
|   `-- app.js
|-- deployment/
|   `-- deployment.json
|-- tests/
|   `-- TEST_RESULTS.md
|-- screenshots/
|   `-- README.md
|-- .gitignore
`-- README.md
```

## Smart-contract roles and workflow

1. Any wallet can report a found item.
2. A different wallet can request a claim using a short, non-sensitive proof reference.
3. Only the original reporter can approve or reject that claim.
4. The deployment account is the administrator and can close an available listing.
5. Anyone can retrieve item data from the contract.

The deliberately restricted reporter and administrator functions make unauthorised-input testing clear and reproducible.

## Compile and deploy with Remix

1. Keep Ganache running at `http://127.0.0.1:7545` with chain ID `1337`.
2. Open [Remix IDE](https://remix.ethereum.org/).
3. Create `CampusLostAndFound.sol` in Remix and paste the contents of `contracts/CampusLostAndFound.sol`.
4. Open **Solidity Compiler** and select compiler `0.8.20` or another compatible `0.8.x` version.
5. Under **Advanced Configurations**, set **EVM Version** to `paris` for Ganache GUI compatibility.
6. Compile `CampusLostAndFound.sol` and capture the successful-compilation screenshot.
7. Open **Deploy & Run Transactions** and choose **Injected Provider - MetaMask**.
8. Confirm MetaMask is on **Ganache** and the selected imported account has test ETH.
9. Select `CampusLostAndFound` and press **Deploy**. The constructor has no arguments.
10. Confirm the transaction in MetaMask.
11. Copy the deployed address from Remix and the transaction details from Ganache into `deployment/deployment.json`.

## Run the frontend

Do not open `index.html` by double-clicking it. Run it through a local web server:

### Windows PowerShell

```powershell
cd "path\to\CampusLostAndFoundDApp\frontend"
python -m http.server 8000
```

Then open `http://localhost:8000` in the same browser that has MetaMask installed.

1. Press **Connect MetaMask**.
2. Approve the connection and confirm the network says Ganache (1337).
3. Paste the deployed contract address and press **Load**.
4. Publish a found-item report and confirm the MetaMask transaction.
5. Press **Refresh data** if necessary. The new item and summary counts are retrieved from the blockchain.

The frontend loads Ethers.js from jsDelivr, so an internet connection is required when the page first loads.

## Test accounts

- **Account 1:** the Ganache account used to deploy the contract; it is the administrator.
- **Account 2:** import a second Ganache account into MetaMask for claimant and unauthorised-action tests.

Only use Ganache development keys. Never publish any private key, recovery phrase, password, or real-wallet credential.

## Required tests

Use `tests/TEST_RESULTS.md` as the results table. The minimum evidence set includes:

- Valid report and claim transactions
- Invalid empty item name or nonexistent item ID
- Unauthorised claim review from an account that did not report the item
- Unauthorised administrator close from Account 2
- Successful retrieval and display of blockchain data in the frontend

## Important testing order

1. Account 1 reports item 1.
2. Capture the invalid-input test.
3. Switch to Account 2 and request a claim for item 1.
4. While still on Account 2, attempt `reviewClaim(1, true)` to capture the unauthorised failure.
5. Switch to Account 1 and approve the claim.
6. Report a second item with Account 1.
7. Switch to Account 2 and attempt to close item 2 to capture the administrator-only failure.

## Submission checklist

- [ ] Contract compiles in Remix with EVM version `paris`
- [ ] Contract deployed through MetaMask to Ganache
- [ ] `deployment/deployment.json` contains the actual address, transaction hash, block, and gas used
- [ ] Frontend connects, sends transactions, and displays stored data
- [ ] `tests/TEST_RESULTS.md` contains observed results and evidence
- [ ] Required screenshots are saved under `screenshots/`
- [ ] Repository contains no private keys, seed phrases, passwords, or credentials
- [ ] Project pushed to GitHub
- [ ] Submission Word document contains student details, DApp title, and GitHub link
- [ ] Word document converted to PDF and uploaded to the LMS

## Deployment details

- Network: Ganache
- Chain ID: 1337
- RPC URL: `http://127.0.0.1:7545`
- Contract address: `0x7eBf84506F22dbE1baDE780DD12733F02b921735`
- Deployment transaction: `0x7b88b74f7864582e601bc8e0967ea4caa15b6655f23de6df1b049e3a9e1fcb15`
- Deployment block: 1
- Deployment gas used: 1,928,997
- Successful report transaction: `0xedbfdb5c3f7845e811e8f32a33c8cf8b686cc140c83bd7efe923351589b43dc9` (block 2, gas used 191,215)

## License

Created for CSE4444 Blockchain Technology Assignment 2. Educational use.
