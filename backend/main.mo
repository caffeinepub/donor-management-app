import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Nat32 "mo:core/Nat32";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Donor Data Model
  type DonorId = Nat32;

  type GroceryItem = {
    name : Text;
    quantity : ?Text;
  };

  type DonationType = {
    #money : Nat32;
    #groceries : [GroceryItem];
  };

  type DonationEntry = {
    donationType : DonationType;
    notes : Text;
    timestamp : Time.Time;
    submittedBy : Text;
  };

  type Donor = {
    logNumber : DonorId;
    name : Text;
    address : Text;
    addressNumber : Text;
    place : Text;
    addedDate : Time.Time;
    initialDonationType : DonationType;
    notes : Text;
    mapLink : ?Text;
    donations : [DonationEntry];
  };

  // Sub-Account Types
  type Role = {
    #admin;
    #user;
  };

  type SubAccount = {
    username : Text;
    passwordHash : Text;
    role : Role;
  };

  // Persistent state
  let donors = Map.empty<DonorId, Donor>();
  let groceryItems = List.fromArray(["Rice", "Dal", "Sugar"]);
  let subAccounts = Map.empty<Text, SubAccount>();
  var nextLogNumber : DonorId = 1;

  // Internal function to check admin privileges
  func checkAdmin(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // Internal function to check user privileges (admin or user role)
  func checkUser(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
  };

  func getDonorUnchecked(logNumber : DonorId) : Donor {
    switch (donors.get(logNumber)) {
      case (null) {
        Runtime.trap("Donor does not exist. " # logNumber.toText());
      };
      case (?donor) { donor };
    };
  };

  module Donor {
    public func compare(donor1 : Donor, donor2 : Donor) : Order.Order {
      Nat32.compare(donor1.logNumber, donor2.logNumber);
    };
  };

  // Admin-only: Create a new sub-account
  public shared ({ caller }) func createSubAccount(username : Text, passwordHash : Text, role : Role) : async () {
    checkAdmin(caller);

    if (subAccounts.containsKey(username)) {
      Runtime.trap("Username already exists.");
    };

    let newAccount : SubAccount = {
      username;
      passwordHash;
      role;
    };

    subAccounts.add(username, newAccount);
  };

  // Admin-only: List all sub-accounts
  public query ({ caller }) func listSubAccounts() : async [SubAccount] {
    checkAdmin(caller);
    subAccounts.values().toArray();
  };

  // Admin-only: Delete a sub-account
  public shared ({ caller }) func deleteSubAccount(username : Text) : async () {
    checkAdmin(caller);
    if (not subAccounts.containsKey(username)) {
      Runtime.trap("Sub-account does not exist.");
    };
    subAccounts.remove(username);
  };

  // Authenticate sub-account and return role (no auth check needed - this is the login endpoint)
  public query func authenticateSubAccount(username : Text, passwordHash : Text) : async ?Role {
    switch (subAccounts.get(username)) {
      case (null) { null };
      case (?account) {
        if (account.passwordHash == passwordHash) {
          ?account.role;
        } else {
          null;
        };
      };
    };
  };

  // Add a donation record - accessible to authenticated users (role #user or #admin)
  public shared ({ caller }) func addDonationRecord(
    donorId : DonorId,
    donationEntry : DonationEntry,
  ) : async () {
    // Only authenticated users (user or admin role) can submit donation records
    checkUser(caller);

    switch (donors.get(donorId)) {
      case (null) {
        Runtime.trap("Donor does not exist.");
      };
      case (?existingDonor) {
        let updatedDonations = existingDonor.donations.concat([donationEntry]);

        let updatedDonor : Donor = {
          logNumber = existingDonor.logNumber;
          name = existingDonor.name;
          address = existingDonor.address;
          addressNumber = existingDonor.addressNumber;
          place = existingDonor.place;
          addedDate = existingDonor.addedDate;
          initialDonationType = existingDonor.initialDonationType;
          notes = existingDonor.notes;
          mapLink = existingDonor.mapLink;
          donations = updatedDonations;
        };

        donors.add(donorId, updatedDonor);
      };
    };
  };

  // Admin-only: Create a new donor with map link
  public shared ({ caller }) func createDonor(
    name : Text,
    address : Text,
    addressNumber : Text,
    place : Text,
    donationType : DonationType,
    notes : Text,
    mapLink : ?Text,
  ) : async DonorId {
    checkAdmin(caller);

    let logNumber = nextLogNumber;

    let donor : Donor = {
      logNumber;
      name;
      address;
      addressNumber;
      place;
      addedDate = Time.now();
      initialDonationType = donationType;
      notes;
      mapLink;
      donations = [];
    };

    donors.add(logNumber, donor);
    nextLogNumber += 1;
    logNumber;
  };

  // Admin-only: Edit an existing donor with map link
  public shared ({ caller }) func editDonor(
    logNumber : DonorId,
    name : Text,
    address : Text,
    addressNumber : Text,
    place : Text,
    donationType : DonationType,
    notes : Text,
    mapLink : ?Text,
  ) : async () {
    checkAdmin(caller);
    let existingDonor = getDonorUnchecked(logNumber);

    let updatedDonor : Donor = {
      logNumber;
      name;
      address;
      addressNumber;
      place;
      addedDate = existingDonor.addedDate;
      initialDonationType = donationType;
      notes;
      mapLink;
      donations = existingDonor.donations;
    };

    donors.add(logNumber, updatedDonor);
  };

  // Admin-only: Delete a donor
  public shared ({ caller }) func deleteDonor(logNumber : DonorId) : async () {
    checkAdmin(caller);
    if (not donors.containsKey(logNumber)) {
      Runtime.trap("Donor does not exist.");
    };
    donors.remove(logNumber);
  };

  // Admin-only: Add a grocery item to the selection list
  public shared ({ caller }) func addGroceryItem(item : Text) : async () {
    checkAdmin(caller);
    groceryItems.add(item);
  };

  // Admin-only: Delete a grocery item from the selection list
  public shared ({ caller }) func deleteGroceryItem(item : Text) : async () {
    checkAdmin(caller);
    let filteredItems = groceryItems.filter(func(existingItem) { existingItem != item });
    groceryItems.clear();
    groceryItems.addAll(filteredItems.values());
  };

  // Public read-only: Get all donors (no auth check needed - available to all including guests)
  public query func getAllDonors() : async [Donor] {
    donors.values().toArray().sort();
  };

  // Public read-only: Get donors filtered by place (no auth check needed - available to all including guests)
  public query func getDonorsByPlace(place : Text) : async [Donor] {
    donors.values().filter(func(donor) { donor.place == place }).toArray().sort();
  };

  // Public read-only: Get a single donor by log number (no auth check needed - available to all including guests)
  public query func getDonor(logNumber : DonorId) : async ?Donor {
    donors.get(logNumber);
  };

  // Public read-only: Get all available grocery items (no auth check needed - available to all including guests)
  public query func getGroceryItems() : async [Text] {
    groceryItems.toArray();
  };

  // Public read-only: Get all donations for a donor
  public query func getDonationsForDonor(donorId : DonorId) : async [DonationEntry] {
    switch (donors.get(donorId)) {
      case (null) { [] };
      case (?donor) { donor.donations };
    };
  };

  // Internal function to filter donations by date range
  func filterByDateRange(donations : [DonationEntry], startDate : Time.Time, endDate : Time.Time) : [DonationEntry] {
    donations.filter(
      func(donation) {
        donation.timestamp >= startDate and donation.timestamp <= endDate
      }
    );
  };

  // Public read-only: Get donations within a specific date range
  public query func getDonationsByDateRange(
    donorId : DonorId,
    startDate : Time.Time,
    endDate : Time.Time,
  ) : async [DonationEntry] {
    switch (donors.get(donorId)) {
      case (null) { [] };
      case (?donor) { filterByDateRange(donor.donations, startDate, endDate) };
    };
  };

  // Public read-only: Get all available role types (for potential frontend use)
  public query func getRoleTypes() : async [Role] {
    [#admin, #user];
  };

  // ============= Bulk Import Feature =============

  // Type for import results to be compatible with emptyType when never called
  public type ImportResult = {
    totalRows : Nat;
    importedCount : Nat;
    errors : [(Nat, Text)];
  };

  // Empty import function, never called. Needs to exist due to the Import Component requirements
  // Without this backend would not compile even when not used.
  public shared ({ caller }) func bulkImport(_csvData : Text) : async ImportResult {
    checkAdmin(caller);
    {
      totalRows = 0;
      importedCount = 0;
      errors = [];
    };
  };
};
