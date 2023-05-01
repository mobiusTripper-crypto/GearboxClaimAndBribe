import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract, ethers } from "ethers";
import ky from "ky";
import verifyUserArgs from "./verifyUserArgs";
import getGearboxData from "./getGearboxData";

import ClaimAndBribeABI from "../../abis/ClaimAndBribe.json";
import { CLAIM_AND_BRIBED_CONTRACT } from "./constants";

const AURA_GAUGE_CHOICES_URL =
  "https://raw.githubusercontent.com/aurafinance/aura-contracts/main/tasks/snapshot/gauge_choices.json";
const HH_ARUA_API_URL = "https://api.hiddenhand.finance/proposal/aura";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, gelatoArgs, provider } = context;

  try {
    const { multisigClaimAddress, claimTokenAddress, gaugeToBribeAddress } =
      verifyUserArgs(userArgs);

    const { gearboxMerkleProof, rewardAmount, gearboxIndex } =
      await getGearboxData(multisigClaimAddress, provider);

    const balancerProposalHash = ethers.utils.solidityKeccak256(
      ["address"],
      [gaugeToBribeAddress]
    );

    //TODO, make function to get aura proposal hash, make type for auraGaugeChoices

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

    const claimAndBribe = new Contract(
      CLAIM_AND_BRIBED_CONTRACT,
      ClaimAndBribeABI,
      provider
    );

    return {
      canExec: true,
      callData: claimAndBribe.interface.encodeFunctionData("claimAndBribeAll", [
        gearboxIndex,
        rewardAmount,
        gearboxMerkleProof,
        auraProposalHash,
        balancerProposalHash,
        claimTokenAddress,
      ]),
    };
  } catch (error) {
    return { canExec: false, message: error };
  }
});
