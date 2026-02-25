import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Donor, DonorId, DonationEntry, UserProfile, SubAccount, Role } from '../backend';

// ─── Donors ──────────────────────────────────────────────────────────────────

export function useGetAllDonors() {
  const { actor, isFetching } = useActor();
  return useQuery<Donor[]>({
    queryKey: ['donors'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDonors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDonorsByPlace(place: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Donor[]>({
    queryKey: ['donors', 'place', place],
    queryFn: async () => {
      if (!actor) return [];
      if (!place) return actor.getAllDonors();
      return actor.getDonorsByPlace(place);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDonor(logNumber: DonorId) {
  const { actor, isFetching } = useActor();
  return useQuery<Donor | null>({
    queryKey: ['donor', logNumber],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDonor(logNumber);
    },
    enabled: !!actor && !isFetching && logNumber !== undefined,
  });
}

export function useCreateDonor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      address: string;
      addressNumber: string;
      place: string;
      donationType: Donor['initialDonationType'];
      notes: string;
      mapLink: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createDonor(
        params.name,
        params.address,
        params.addressNumber,
        params.place,
        params.donationType,
        params.notes,
        params.mapLink,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
    },
  });
}

export function useEditDonor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      logNumber: DonorId;
      name: string;
      address: string;
      addressNumber: string;
      place: string;
      donationType: Donor['initialDonationType'];
      notes: string;
      mapLink: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editDonor(
        params.logNumber,
        params.name,
        params.address,
        params.addressNumber,
        params.place,
        params.donationType,
        params.notes,
        params.mapLink,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donor', variables.logNumber] });
    },
  });
}

export function useDeleteDonor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logNumber: DonorId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteDonor(logNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
    },
  });
}

// ─── Donation Records ─────────────────────────────────────────────────────────

export function useAddDonationRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { donorId: DonorId; donationEntry: DonationEntry }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addDonationRecord(params.donorId, params.donationEntry);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donor', variables.donorId] });
    },
  });
}

// ─── Grocery Items ────────────────────────────────────────────────────────────

export function useGetGroceryItems() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ['groceryItems'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGroceryItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddGroceryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addGroceryItem(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryItems'] });
    },
  });
}

export function useDeleteGroceryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteGroceryItem(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryItems'] });
    },
  });
}

// ─── Sub-Accounts ─────────────────────────────────────────────────────────────

export function useListSubAccounts() {
  const { actor, isFetching } = useActor();
  return useQuery<SubAccount[]>({
    queryKey: ['subAccounts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSubAccounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSubAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { username: string; passwordHash: string; role: Role }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSubAccount(params.username, params.passwordHash, params.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subAccounts'] });
    },
  });
}

export function useDeleteSubAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSubAccount(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subAccounts'] });
    },
  });
}

export function useAuthenticateSubAccount() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: { username: string; passwordHash: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.authenticateSubAccount(params.username, params.passwordHash);
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
