# Journal3 — Contract Deployments

## Testnet — BOT Chain Testnet (Bohr)

| Field        | Value                                        |
| ------------ | -------------------------------------------- |
| Network      | BOT Chain Testnet (Bohr)                     |
| Chain ID     | 968                                          |
| RPC          | `https://rpc.bohr.life`                      |
| Explorer     | https://scan.bohr.life                       |
| Contract     | `0xd70AEB75A3C42f525819CBd6337BEd98d9d80983` |
| Explorer link | https://scan.bohr.life/address/0xd70AEB75A3C42f525819CBd6337BEd98d9d80983 |

## Mainnet — BOT Chain Mainnet

| Field        | Value                                        |
| ------------ | -------------------------------------------- |
| Network      | BOT Chain Mainnet                            |
| Chain ID     | 677                                          |
| RPC          | `https://rpc.botchain.ai`                    |
| Explorer     | https://scan.botchain.ai                     |
| Contract     | `0xBd9c1896A5eD022c4c708295E0D72a45F3E4F413` |
| Explorer link | https://scan.botchain.ai/address/0xBd9c1896A5eD022c4c708295E0D72a45F3E4F413 |

## Notes

- Both contracts deployed from wallet `0x332725273AD9BCf6824429bC1C4acD74970d1C42`.
- Solidity `0.8.20+`, EVM version `paris`, Optimizer ON (200 runs) — see `contracts/Journal3.sol` header.
- To point the app at a network, update `ACTIVE_NET` and `CONTRACT_ADDRESS` in `app.js` (lines 26-27).
