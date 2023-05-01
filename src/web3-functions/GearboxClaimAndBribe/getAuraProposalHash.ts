import ky from "ky";
import { AURA_GAUGE_CHOICES_URL, HH_ARUA_API_URL } from "./constants";

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

export default async function getAuraProposalHash(
  gaugeToBribeAddress: string
): Promise<string> {
  const auraGaugeChoices: any = await ky.get(AURA_GAUGE_CHOICES_URL).json();
  const gaugeLabel = (
    auraGaugeChoices as [{ address: string; label: string }]
  ).find((xxx) => xxx.address === gaugeToBribeAddress)?.label;
  //console.log("gaugeLabel", gaugeLabel);

  const response: any = await ky.get(HH_ARUA_API_URL).json();
  const hiddenHandTargets = response["data"] as [HiddenHandAuraProposalType];

  const auraProposalHash = hiddenHandTargets.find(
    (xxx) => xxx.title === gaugeLabel
  )?.proposalHash;

  //TODO: throw when undefined
  return auraProposalHash || "";
}
