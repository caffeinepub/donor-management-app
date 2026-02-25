import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DonationEntry {
    donationType: DonationType;
    submittedBy: string;
    notes: string;
    timestamp: Time;
}
export type DonorId = number;
export type Time = bigint;
export interface Donor {
    initialDonationType: DonationType;
    mapLink?: string;
    name: string;
    logNumber: DonorId;
    addressNumber: string;
    address: string;
    notes: string;
    addedDate: Time;
    place: string;
    donations: Array<DonationEntry>;
}
export interface SubAccount {
    username: string;
    role: Role;
    passwordHash: string;
}
export interface ImportResult {
    errors: Array<[bigint, string]>;
    totalRows: bigint;
    importedCount: bigint;
}
export type DonationType = {
    __kind__: "money";
    money: number;
} | {
    __kind__: "groceries";
    groceries: Array<GroceryItem>;
};
export interface GroceryItem {
    name: string;
    quantity?: string;
}
export interface UserProfile {
    name: string;
}
export enum Role {
    admin = "admin",
    user = "user"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDonationRecord(donorId: DonorId, donationEntry: DonationEntry): Promise<void>;
    addGroceryItem(item: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    authenticateSubAccount(username: string, passwordHash: string): Promise<Role | null>;
    bulkImport(_csvData: string): Promise<ImportResult>;
    createDonor(name: string, address: string, addressNumber: string, place: string, donationType: DonationType, notes: string, mapLink: string | null): Promise<DonorId>;
    createSubAccount(username: string, passwordHash: string, role: Role): Promise<void>;
    deleteDonor(logNumber: DonorId): Promise<void>;
    deleteGroceryItem(item: string): Promise<void>;
    deleteSubAccount(username: string): Promise<void>;
    editDonor(logNumber: DonorId, name: string, address: string, addressNumber: string, place: string, donationType: DonationType, notes: string, mapLink: string | null): Promise<void>;
    getAllDonors(): Promise<Array<Donor>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDonationsByDateRange(donorId: DonorId, startDate: Time, endDate: Time): Promise<Array<DonationEntry>>;
    getDonationsForDonor(donorId: DonorId): Promise<Array<DonationEntry>>;
    getDonor(logNumber: DonorId): Promise<Donor | null>;
    getDonorsByPlace(place: string): Promise<Array<Donor>>;
    getGroceryItems(): Promise<Array<string>>;
    getRoleTypes(): Promise<Array<Role>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listSubAccounts(): Promise<Array<SubAccount>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
