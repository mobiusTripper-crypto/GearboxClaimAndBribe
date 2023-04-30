import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract, ethers } from "ethers";
import ky from "ky"; // we recommend using ky as axios doesn't support fetch by default

import GearAirdropDistributorABI from "../../abis/GearAirdropDistributor.json";
import ClaimAndBribeABI from "../../abis/ClaimAndBribe.json";

const GEARBOX_MERKLE_URL =
  "https://raw.githubusercontent.com/Gearbox-protocol/rewards/master/merkle/";

const AURA_GAUGE_CHOICES_URL =
  "https://raw.githubusercontent.com/aurafinance/aura-contracts/main/tasks/snapshot/gauge_choices.json";
const HH_ARUA_API_URL = "https://api.hiddenhand.finance/proposal/aura";

const GEARBOX_TREE = "0xA7Df60785e556d65292A2c9A077bb3A8fBF048BC";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, gelatoArgs, provider } = context;

  // {"proposal":"0","proposalHash":"0x6409e776209ceef311a5079f1f88ceb6573a4af49a7d13d90735d85133910e8c",
  // "title":"veBAL","proposalDeadline":1682971200,"totalValue":0,"voteCount":134,"valuePerVote":0,"bribes":[]},

  type HiddenHandAuraProposalType = {
    proposal: number;
    proposalHash: string;
    title: string;
    proposalDeadline: number;
    totalvalue: string;
    voteCount: string;
    valuePerVote: string;
    bribes: [];
  };

  const proof = async () => {
    const contract = new Contract(
      GEARBOX_TREE,
      GearAirdropDistributorABI,
      provider
    );

    const proof1 = (await contract.merkleRoot()) as string;

    return ethers.utils.isHexString(proof1) ? proof1.slice(2) : proof1;
  };
  const xxx1 = await proof();

  const gearboxMerkleProofURL = `${GEARBOX_MERKLE_URL}mainnet_${xxx1}.json`;

  const gearjson: any = await ky
    .get(gearboxMerkleProofURL, { timeout: 5_000, retry: 0 })
    .json();

  const balancerProposalHash = ethers.utils.solidityKeccak256(
    ["address"],
    [userArgs.gaugeToBribeAddress]
  );
  //console.log("balancerProposalHash", balancerProposalHash);

  const auraGaugeChoices: any = await ky.get(AURA_GAUGE_CHOICES_URL).json();

  const gaugeLabel = (
    auraGaugeChoices as [{ address: string; label: string }]
  ).find((xxx) => xxx.address === userArgs.gaugeToBribeAddress)?.label;
  //console.log("gaugeLabel", gaugeLabel);

  const response: any = await ky.get(HH_ARUA_API_URL).json();
  const hiddenHandTargets = response["data"] as [HiddenHandAuraProposalType];

  const auraProposalHash = hiddenHandTargets.find(
    (xxx) => xxx.title === gaugeLabel
  )?.proposalHash;
  //console.log("auraProposalHash", auraProposalHash);

  const geardata = gearjson["claims"][userArgs.claimAddress as string];
  const index = parseInt(geardata.index);
  const totalAmount = ethers.utils.formatEther(geardata.amount);

  //  console.log("1", ethers.utils.formatEther(geardata.amount));

  console.log(`claimAndBribeAll(
  ${index},
  ${geardata.amount},
  ${geardata.proof},
  ${auraProposalHash},
  ${balancerProposalHash},
  ${userArgs.claimTokenAddress}) `);

  const claimAndBribe = new Contract(GEARBOX_TREE, ClaimAndBribeABI, provider);

  // Return execution call data
  return {
    canExec: true,
    callData: claimAndBribe.interface.encodeFunctionData("claimAndBribeAll", [
      index,
      geardata.amount,
      geardata.proof,
      auraProposalHash,
      balancerProposalHash,
      userArgs.claimTokenAddress,
    ]),
  };
});
