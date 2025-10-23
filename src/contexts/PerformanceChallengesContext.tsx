import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

export type PerformanceMetricType =
  | "sales"
  | "sales_value"
  | "listings"
  | "meetings"
  | "tasks"
  | "calls"
  | "visits"
  | "in_person_visits";

export type PerformanceChallengeStatus = "active" | "completed" | "cancelled" | "overdue";
export type PerformanceChallengePriority = "low" | "medium" | "high";

type DbChallenge = Database["public"]["Tables"]["performance_challenges"]["Row"];

type DbTarget = Database["public"]["Tables"]["performance_targets"]["Row"];

export interface PerformanceTarget {
  id: string;
  challengeId: string;
  metricType: PerformanceMetricType;
  targetValue: number;
  currentValue: number;
  createdAt: string;
  updatedAt: string;
  progress: number;
}

export interface PerformanceChallenge {
  id: string;
  userId: string;
  brokerId: string;
  title: string;
  description?: string | null;
  status: PerformanceChallengeStatus;
  priority: PerformanceChallengePriority;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  targets: PerformanceTarget[];
  overallProgress: number;
  isOverdue: boolean;
}

export interface PerformanceTargetInput {
  id?: string;
  metricType: PerformanceMetricType;
  targetValue: number;
  currentValue?: number;
}

export interface CreateChallengeInput {
  brokerId: string;
  title: string;
  description?: string;
  status?: PerformanceChallengeStatus;
  priority?: PerformanceChallengePriority;
  startDate: string;
  endDate: string;
  targets: PerformanceTargetInput[];
}

export interface UpdateChallengeInput {
  title?: string;
  description?: string | null;
  status?: PerformanceChallengeStatus;
  priority?: PerformanceChallengePriority;
  startDate?: string;
  endDate?: string;
  targets?: PerformanceTargetInput[];
}

interface PerformanceChallengesContextValue {
  challenges: PerformanceChallenge[];
  isLoading: boolean;
  createChallenge: (input: CreateChallengeInput) => Promise<PerformanceChallenge>;
  updateChallenge: (id: string, input: UpdateChallengeInput) => Promise<PerformanceChallenge>;
  deleteChallenge: (id: string) => Promise<void>;
  getChallengesByBrokerId: (brokerId: string) => PerformanceChallenge[];
  refreshChallenges: () => Promise<void>;
}

const PerformanceChallengesContext = createContext<PerformanceChallengesContextValue | undefined>(
  undefined,
);

const mapTarget = (target: DbTarget): PerformanceTarget => {
  const progress = target.target_value > 0
    ? Math.min(Math.max(target.current_value / target.target_value, 0), 1) * 100
    : 0;

  return {
    id: target.id,
    challengeId: target.challenge_id,
    metricType: target.metric_type as PerformanceMetricType,
    targetValue: Number(target.target_value || 0),
    currentValue: Number(target.current_value || 0),
    createdAt: target.created_at,
    updatedAt: target.updated_at,
    progress,
  };
};

const mapChallenge = (challenge: DbChallenge, targets: DbTarget[] = []): PerformanceChallenge => {
  const mappedTargets = targets.map(mapTarget);
  const relevantTargets = mappedTargets.filter((target) => target.targetValue > 0);

  const overallProgress = relevantTargets.length === 0
    ? 0
    : relevantTargets.reduce((sum, target) => sum + target.progress, 0) / relevantTargets.length;

  const endDate = new Date(challenge.end_date);
  const today = new Date();
  const isOverdue = overallProgress < 100 && challenge.status !== "completed" && endDate < today;

  return {
    id: challenge.id,
    userId: challenge.user_id,
    brokerId: challenge.broker_id,
    title: challenge.title,
    description: challenge.description,
    status: (challenge.status as PerformanceChallengeStatus) || "active",
    priority: (challenge.priority as PerformanceChallengePriority) || "medium",
    startDate: challenge.start_date,
    endDate: challenge.end_date,
    createdAt: challenge.created_at,
    updatedAt: challenge.updated_at,
    targets: mappedTargets,
    overallProgress,
    isOverdue,
  };
};

export const PerformanceChallengesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<PerformanceChallenge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const sortChallengesByEndDate = (list: PerformanceChallenge[]) =>
    [...list].sort((a, b) => {
      const endA = new Date(a.endDate).getTime();
      const endB = new Date(b.endDate).getTime();
      const safeEndA = Number.isNaN(endA) ? 0 : endA;
      const safeEndB = Number.isNaN(endB) ? 0 : endB;
      return safeEndA - safeEndB;
    });

  const loadChallengeWithTargets = async (challengeId: string): Promise<PerformanceChallenge> => {
    const { data: challengeRow, error: challengeError } = await supabase
      .from("performance_challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeError) throw challengeError;

    const { data: targetRows, error: targetsError } = await supabase
      .from("performance_targets")
      .select("*")
      .eq("challenge_id", challengeId);

    if (targetsError) throw targetsError;

    return mapChallenge(challengeRow as DbChallenge, (targetRows ?? []) as DbTarget[]);
  };

  const fetchChallenges = async () => {
    if (!user) {
      setChallenges([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data: challengeRows, error } = await supabase
        .from("performance_challenges")
        .select("*")
        .eq("user_id", user.id)
        .order("end_date", { ascending: true });

      if (error) throw error;

      const rows = (challengeRows ?? []) as DbChallenge[];
      const challengeIds = rows.map((row) => row.id);

      let targetsByChallenge: Record<string, DbTarget[]> = {};

      if (challengeIds.length > 0) {
        const { data: targetRows, error: targetsError } = await supabase
          .from("performance_targets")
          .select("*")
          .in("challenge_id", challengeIds);

        if (targetsError) throw targetsError;

        targetsByChallenge = (targetRows ?? []).reduce<Record<string, DbTarget[]>>((acc, target) => {
          if (!acc[target.challenge_id]) {
            acc[target.challenge_id] = [];
          }
          acc[target.challenge_id].push(target as DbTarget);
          return acc;
        }, {});
      }

      const mapped = rows.map((row) =>
        mapChallenge(row, targetsByChallenge[row.id] ?? []),
      );
      setChallenges(sortChallengesByEndDate(mapped));
    } catch (error) {
      console.error("Error fetching performance challenges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();

    if (!user) {
      return;
    }

    const channel = supabase
      .channel("performance_challenges_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "performance_challenges",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchChallenges(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "performance_targets",
        },
        () => fetchChallenges(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const resolveUserId = async () => {
    if (user?.id) {
      return user.id;
    }

    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  };

  const createChallenge = async (input: CreateChallengeInput): Promise<PerformanceChallenge> => {
    const currentUserId = await resolveUserId();

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const challengePayload = {
      user_id: currentUserId,
      broker_id: input.brokerId,
      title: input.title,
      description: input.description || null,
      status: input.status || "active",
      priority: input.priority || "medium",
      start_date: input.startDate,
      end_date: input.endDate,
    };

    const { data: challengeRow, error: challengeError } = await supabase
      .from("performance_challenges")
      .insert(challengePayload)
      .select("*")
      .single();

    if (challengeError) throw challengeError;

    if (input.targets.length > 0) {
      const targetsPayload = input.targets.map((target) => ({
        challenge_id: challengeRow.id,
        metric_type: target.metricType,
        target_value: target.targetValue,
        current_value: target.currentValue ?? 0,
      }));

      const { error: targetsError } = await supabase
        .from("performance_targets")
        .insert(targetsPayload);

      if (targetsError) throw targetsError;
    }

    const mapped = await loadChallengeWithTargets(challengeRow.id);
    setChallenges((prev) =>
      sortChallengesByEndDate([
        ...prev.filter((challenge) => challenge.id !== mapped.id),
        mapped,
      ]),
    );
    return mapped;
  };

  const updateChallenge = async (
    id: string,
    input: UpdateChallengeInput,
  ): Promise<PerformanceChallenge> => {
    const updatePayload: Partial<Database["public"]["Tables"]["performance_challenges"]["Update"]> = {};

    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.priority !== undefined) updatePayload.priority = input.priority;
    if (input.startDate !== undefined) updatePayload.start_date = input.startDate;
    if (input.endDate !== undefined) updatePayload.end_date = input.endDate;

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from("performance_challenges")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) throw updateError;
    }

    if (input.targets) {
      const { data: existingTargets } = await supabase
        .from("performance_targets")
        .select("id")
        .eq("challenge_id", id);

      const existingIds = new Set((existingTargets || []).map((target) => target.id));
      const incomingIds = new Set(
        input.targets.filter((target) => Boolean(target.id)).map((target) => target.id as string),
      );

      const idsToDelete = [...existingIds].filter((targetId) => !incomingIds.has(targetId));
      if (idsToDelete.length > 0) {
        await supabase.from("performance_targets").delete().in("id", idsToDelete);
      }

      const targetsToUpsert = input.targets
        .filter((target) => Boolean(target.id))
        .map((target) => ({
          id: target.id,
          challenge_id: id,
          metric_type: target.metricType,
          target_value: target.targetValue,
          current_value: target.currentValue ?? 0,
        }));

      if (targetsToUpsert.length > 0) {
        await supabase
          .from("performance_targets")
          .upsert(targetsToUpsert, { onConflict: "id" });
      }

      const targetsToInsert = input.targets
        .filter((target) => !target.id)
        .map((target) => ({
          challenge_id: id,
          metric_type: target.metricType,
          target_value: target.targetValue,
          current_value: target.currentValue ?? 0,
        }));

      if (targetsToInsert.length > 0) {
        await supabase.from("performance_targets").insert(targetsToInsert);
      }
    }

    const mapped = await loadChallengeWithTargets(id);
    setChallenges((prev) =>
      sortChallengesByEndDate(
        prev.map((challenge) => (challenge.id === id ? mapped : challenge)),
      ),
    );
    return mapped;
  };

  const deleteChallenge = async (id: string) => {
    await supabase.from("performance_targets").delete().eq("challenge_id", id);
    const { error } = await supabase
      .from("performance_challenges")
      .delete()
      .eq("id", id);

    if (error) throw error;

    setChallenges((prev) => prev.filter((challenge) => challenge.id !== id));
  };

  const getChallengesByBrokerId = (brokerId: string) =>
    challenges.filter((challenge) => challenge.brokerId === brokerId);

  const refreshChallenges = async () => {
    await fetchChallenges();
  };

  const value: PerformanceChallengesContextValue = {
    challenges,
    isLoading,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    getChallengesByBrokerId,
    refreshChallenges,
  };

  return (
    <PerformanceChallengesContext.Provider value={value}>
      {children}
    </PerformanceChallengesContext.Provider>
  );
};

export const usePerformanceChallenges = () => {
  const context = useContext(PerformanceChallengesContext);
  if (!context) {
    throw new Error("usePerformanceChallenges deve ser usado dentro de PerformanceChallengesProvider");
  }
  return context;
};
