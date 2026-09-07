import { useEffect, useReducer } from "react";

export interface AxisStat {
  axisId: number;
  axisName: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  average: number | null;
  spread: number;
  memberScores: number[];
}

export interface GroupComparisonData {
  group: {
    id: string;
    name: string;
    inviteCode: string;
    showNames: boolean;
    isCreator: boolean;
  };
  members: {
    id: string;
    isSelf: boolean;
    name: string | null;
    scores: { axisId: number; score: number }[];
  }[];
  axisStats: AxisStat[];
}

interface GroupComparisonState {
  groupId: string;
  data: GroupComparisonData | null;
  error: string;
}

type GroupComparisonAction =
  | { type: "REQUEST"; groupId: string }
  | { type: "SUCCESS"; groupId: string; data: GroupComparisonData }
  | { type: "FAILURE"; groupId: string; error: string };

function groupComparisonReducer(
  state: GroupComparisonState,
  action: GroupComparisonAction
): GroupComparisonState {
  switch (action.type) {
    case "REQUEST":
      return { groupId: action.groupId, data: null, error: "" };
    case "SUCCESS":
      return state.groupId === action.groupId
        ? { ...state, data: action.data, error: "" }
        : state;
    case "FAILURE":
      return state.groupId === action.groupId
        ? { ...state, error: action.error }
        : state;
  }
}

export function useGroupComparison(groupId: string) {
  const [state, dispatch] = useReducer(groupComparisonReducer, {
    groupId: "",
    data: null,
    error: "",
  });

  useEffect(() => {
    let active = true;
    dispatch({ type: "REQUEST", groupId });

    fetch(`/api/groups/${groupId}/compare`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load group");
        return res.json();
      })
      .then((groupData: GroupComparisonData) => {
        if (!active) return;
        dispatch({ type: "SUCCESS", groupId, data: groupData });
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        dispatch({
          type: "FAILURE",
          groupId,
          error: requestError instanceof Error ? requestError.message : "Failed to load group",
        });
      });

    return () => {
      active = false;
    };
  }, [groupId]);

  return { data: state.data, error: state.error };
}
