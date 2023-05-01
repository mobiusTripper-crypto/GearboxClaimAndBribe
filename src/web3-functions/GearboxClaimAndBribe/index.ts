import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract, ethers } from "ethers";

import verifyUserArgs from "./verifyUserArgs";
import getGearboxData from "./getGearboxData";
import getAuraProposalHash from "./getAuraProposalHash";

import ClaimAndBribeABI from "../../abis/ClaimAndBribe.json";
import { CLAIM_AND_BRIBED_CONTRACT } from "./constants";

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

    const auraProposalHash = await getAuraProposalHash(gaugeToBribeAddress);

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
