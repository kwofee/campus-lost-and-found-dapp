# Test Cases and Results

Complete the **Observed result** and **Transaction hash / evidence** columns after testing in Remix and the frontend. Do not invent results; record what actually happened.

| ID | Type | Account | Test steps | Expected result | Observed result | Transaction hash / evidence |
|---|---|---|---|---|---|---|
| T01 | Valid | Account 1 | Call `reportItem("Water bottle", "Pink cap and sticker", "Room 204 AB5")` | Transaction succeeds; item 1 is stored with `Available` status; `ItemReported` event emitted | Passed - transaction mined in block 2; `itemCount` returned 1 and `getItem(1)` returned the stored details | `0xedbfdb5c3f7845e811e8f32a33c8cf8b686cc140c83bd7efe923351589b43dc9` |
| T02 | Invalid | Account 1 | Call `reportItem("", "Pink cap and sticker", "Room 204 AB5")` | Transaction reverts because the item name is shorter than 3 characters | Passed - Remix rejected gas estimation and warned that execution would fail; transaction was cancelled | `screenshots/05-invalid-input-revert.png` |
| T03 | Valid | Account 2 | Call `requestClaim(1, "Sticker detail agreed off-chain")` | Transaction succeeds; status becomes `ClaimPending`; claimant is Account 2 | Pending | Pending |
| T04 | Invalid | Account 2 | Call `requestClaim(999, "Some reference")` | Transaction reverts with `Item does not exist` | Pending | Pending |
| T05 | Unauthorised | Account 2 | Call `reviewClaim(1, true)` for an item reported by Account 1 | Transaction reverts with `Only the reporter can review` | Pending | Pending |
| T06 | Valid | Account 1 | Call `reviewClaim(1, true)` | Transaction succeeds; item status becomes `Returned`; `ClaimReviewed` event emitted | Pending | Pending |
| T07 | Unauthorised | Account 2 | On a new available item, call `closeItem(itemId)` | Transaction reverts with `Administrator only` | Pending | Pending |
| T08 | Retrieval | Account 1 | Load the deployed address in the frontend and press **Refresh data** | Stored listings and status counts appear from the blockchain | Passed - frontend connected to Ganache and displayed the stored listing | `screenshots/07-frontend-blockchain-data.png` |

## Suggested evidence filenames

- `04-valid-report-transaction.png`
- `05-invalid-input-revert.png`
- `06-unauthorised-review-revert.png`
- `07-frontend-blockchain-data.png`
