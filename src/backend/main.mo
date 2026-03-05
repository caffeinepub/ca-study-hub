import Map "mo:core/Map";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type CA_Level = {
    #foundation;
    #intermediate;
    #final;
  };

  type TimetableSlot = {
    slotId : Text;
    dayOfWeek : Text;
    time : Text;
    subject : Text;
    caLevel : CA_Level;
  };

  module TimetableSlot {
    public func compare(t1 : TimetableSlot, t2 : TimetableSlot) : Order.Order {
      switch (Text.compare(t1.dayOfWeek, t2.dayOfWeek)) {
        case (#equal) {
          switch (Text.compare(t1.time, t2.time)) {
            case (#equal) { Text.compare(t1.slotId, t2.slotId) };
            case (order) { order };
          };
        };
        case (order) { order };
      };
    };
  };

  type ChapterProgress = {
    chapterId : Text;
    subject : Text;
    caLevel : CA_Level;
    completed : Bool;
  };

  type StudySession = {
    sessionId : Text;
    subject : Text;
    caLevel : CA_Level;
    durationMins : Nat;
    timestamp : Time.Time;
  };

  type TimerSession = {
    timerId : Text;
    subject : Text;
    caLevel : CA_Level;
    durationMins : Nat;
    timerType : {
      #pomodoro;
      #stopwatch;
    };
  };

  module TimerSession {
    public func compare(ts1 : TimerSession, ts2 : TimerSession) : Order.Order {
      Text.compare(ts1.timerId, ts2.timerId);
    };
  };

  type PDFMetadata = {
    pdfId : Text;
    name : Text;
    subject : Text;
    caLevel : CA_Level;
    blobKey : Storage.ExternalBlob;
  };

  type UserData = {
    timetable : Set.Set<TimetableSlot>;
    chapterProgress : Map.Map<Text, ChapterProgress>;
    studySessions : Map.Map<Text, StudySession>;
    timerSessions : Set.Set<TimerSession>;
    pdfMetadata : Map.Map<Text, PDFMetadata>;
  };

  public type UserProfile = {
    name : Text;
  };

  let users = Map.empty<Principal, UserData>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func getUserDataInternal(user : Principal) : UserData {
    switch (users.get(user)) {
      case (?data) { data };
      case (null) {
        let newData = {
          timetable = Set.empty<TimetableSlot>();
          chapterProgress = Map.empty<Text, ChapterProgress>();
          studySessions = Map.empty<Text, StudySession>();
          timerSessions = Set.empty<TimerSession>();
          pdfMetadata = Map.empty<Text, PDFMetadata>();
        };
        users.add(user, newData);
        newData;
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
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

  public query ({ caller }) func getTimetable() : async [TimetableSlot] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access timetable");
    };
    getUserDataInternal(caller).timetable.toArray().sort();
  };

  public shared ({ caller }) func addOrUpdateTimetableSlot(slot : TimetableSlot) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify timetable");
    };
    let userData = getUserDataInternal(caller);
    let filteredTimetable = userData.timetable.toArray().values().filter(
      func(existing) {
        existing.slotId != slot.slotId;
      }
    );
    userData.timetable.clear();
    if (filteredTimetable.size() > 0) {
      let arrayFiltered = filteredTimetable.toArray();
      if (arrayFiltered.size() > 0) {
        let firstFiltered = arrayFiltered[0];
        userData.timetable.add(firstFiltered);
      };
    };
    userData.timetable.add(slot);
  };

  public shared ({ caller }) func removeTimetableSlot(slotId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify timetable");
    };
    let userData = getUserDataInternal(caller);
    let newSlots = userData.timetable.toArray().values().filter(
      func(slot) {
        slot.slotId != slotId;
      }
    );
    userData.timetable.clear();
    if (newSlots.size() > 0) {
      let arrayNewSlots = newSlots.toArray();
      if (arrayNewSlots.size() > 0) {
        let firstNewSlot = arrayNewSlots[0];
        userData.timetable.add(firstNewSlot);
      };
    };
  };

  public query ({ caller }) func getChapterProgress() : async [ChapterProgress] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access chapter progress");
    };
    getUserDataInternal(caller).chapterProgress.values().toArray();
  };

  public shared ({ caller }) func updateChapterProgress(chapter : ChapterProgress) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update chapter progress");
    };
    let userData = getUserDataInternal(caller);
    userData.chapterProgress.add(chapter.chapterId, chapter);
  };

  public query ({ caller }) func getStudySessions() : async [StudySession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access study sessions");
    };
    getUserDataInternal(caller).studySessions.values().toArray();
  };

  public shared ({ caller }) func logStudySession(session : StudySession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log study sessions");
    };
    let userData = getUserDataInternal(caller);
    userData.studySessions.add(session.sessionId, session);
  };

  public query ({ caller }) func getTimerSessions() : async [TimerSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access timer sessions");
    };
    getUserDataInternal(caller).timerSessions.toArray().sort();
  };

  public shared ({ caller }) func addTimerSession(session : TimerSession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add timer sessions");
    };
    getUserDataInternal(caller).timerSessions.add(session);
  };

  public query ({ caller }) func getPDFMetadata() : async [PDFMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access PDF metadata");
    };
    getUserDataInternal(caller).pdfMetadata.values().toArray();
  };

  public shared ({ caller }) func addOrUpdatePDFMetadata(meta : PDFMetadata) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify PDF metadata");
    };
    let userData = getUserDataInternal(caller);
    userData.pdfMetadata.add(meta.pdfId, meta);
  };

  public shared ({ caller }) func removePDFMetadata(pdfId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove PDF metadata");
    };
    let userData = getUserDataInternal(caller);
    userData.pdfMetadata.remove(pdfId);
  };
};
