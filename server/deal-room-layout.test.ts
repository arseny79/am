import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("REQ-16: Desktop Always-Visible Messages", () => {
  const dealRoomPath = path.join(__dirname, "../client/src/pages/DealRoom.tsx");
  const compactMessagingPath = path.join(__dirname, "../client/src/components/CompactMessaging.tsx");
  const dealRoomContent = fs.readFileSync(dealRoomPath, "utf-8");

  it("CompactMessaging component exists", () => {
    expect(fs.existsSync(compactMessagingPath)).toBe(true);
  });

  it("DealRoom imports CompactMessaging", () => {
    expect(dealRoomContent).toContain("CompactMessaging");
    expect(dealRoomContent).toContain("import { CompactMessaging }");
  });

  it("Desktop messages section is hidden on mobile (hidden lg:block)", () => {
    expect(dealRoomContent).toContain('className="hidden lg:block');
  });

  it("Mobile tabs include Messages tab with lg:hidden", () => {
    // Mobile TabsList should have lg:hidden
    expect(dealRoomContent).toContain('className="grid w-full grid-cols-5 lg:hidden"');
    // Messages tab content should be lg:hidden
    expect(dealRoomContent).toContain('className="space-y-4 lg:hidden"');
  });

  it("Desktop TabsList does NOT include Messages tab", () => {
    // Desktop TabsList should have hidden lg:inline-grid
    expect(dealRoomContent).toContain('className="hidden lg:inline-grid lg:grid-cols-4');
    // Desktop tabs should be Documents, Activity, Due Diligence, Offers (4 tabs, no Messages)
    const desktopTabsMatch = dealRoomContent.match(/hidden lg:inline-grid lg:grid-cols-4[\s\S]*?<\/TabsList>/);
    expect(desktopTabsMatch).toBeTruthy();
    if (desktopTabsMatch) {
      expect(desktopTabsMatch[0]).not.toContain('value="messages"');
      expect(desktopTabsMatch[0]).toContain('value="documents"');
      expect(desktopTabsMatch[0]).toContain('value="overview"');
    }
  });

  it("Default tab is 'documents' on desktop and 'messages' on mobile", () => {
    // The useState initializer checks window.innerWidth >= 1024
    expect(dealRoomContent).toContain('window.innerWidth >= 1024');
    expect(dealRoomContent).toContain('return "documents"');
    expect(dealRoomContent).toContain('return "messages"');
  });

  it("CompactMessaging shows last 5 messages in compact view", () => {
    const compactContent = fs.readFileSync(compactMessagingPath, "utf-8");
    expect(compactContent).toContain("COMPACT_MESSAGE_COUNT");
    expect(compactContent).toContain("const COMPACT_MESSAGE_COUNT = 5");
  });

  it("CompactMessaging has View All / Show Recent toggle", () => {
    const compactContent = fs.readFileSync(compactMessagingPath, "utf-8");
    expect(compactContent).toContain("View All");
    expect(compactContent).toContain("Show Recent");
    expect(compactContent).toContain("isExpanded");
  });

  it("CompactMessaging has always-visible message input", () => {
    const compactContent = fs.readFileSync(compactMessagingPath, "utf-8");
    expect(compactContent).toContain("Type a message");
    expect(compactContent).toContain("handleSend");
    expect(compactContent).toContain("sendMessageMutation");
  });

  it("CompactMessaging uses precise timestamps", () => {
    const compactContent = fs.readFileSync(compactMessagingPath, "utf-8");
    expect(compactContent).toContain("formatTimestamp");
    expect(compactContent).toContain('month: "short"');
    expect(compactContent).toContain('hour12: true');
  });

  it("Desktop messages section has id for scroll targeting", () => {
    expect(dealRoomContent).toContain('id="desktop-messages-section"');
  });

  it("handleSendMessage scrolls to desktop messages on desktop", () => {
    expect(dealRoomContent).toContain('document.getElementById("desktop-messages-section")?.scrollIntoView');
  });
});
