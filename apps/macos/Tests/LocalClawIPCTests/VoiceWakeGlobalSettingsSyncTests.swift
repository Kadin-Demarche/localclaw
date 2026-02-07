import LocalClawProtocol
import Foundation
import Testing
@testable import LocalClaw

@Suite(.serialized) struct VoiceWakeGlobalSettingsSyncTests {
    @Test func appliesVoiceWakeChangedEventToAppState() async {
        let previous = await MainActor.run { AppStateStore.shared.swabbleTriggerWords }

        await MainActor.run {
            AppStateStore.shared.applyGlobalVoiceWakeTriggers(["before"])
        }

        let payload = LocalClawProtocol.AnyCodable(["triggers": ["localclaw", "computer"]])
        let evt = EventFrame(
            type: "event",
            event: "voicewake.changed",
            payload: payload,
            seq: nil,
            stateversion: nil)

        await VoiceWakeGlobalSettingsSync.shared.handle(push: .event(evt))

        let updated = await MainActor.run { AppStateStore.shared.swabbleTriggerWords }
        #expect(updated == ["localclaw", "computer"])

        await MainActor.run {
            AppStateStore.shared.applyGlobalVoiceWakeTriggers(previous)
        }
    }

    @Test func ignoresVoiceWakeChangedEventWithInvalidPayload() async {
        let previous = await MainActor.run { AppStateStore.shared.swabbleTriggerWords }

        await MainActor.run {
            AppStateStore.shared.applyGlobalVoiceWakeTriggers(["before"])
        }

        let payload = LocalClawProtocol.AnyCodable(["unexpected": 123])
        let evt = EventFrame(
            type: "event",
            event: "voicewake.changed",
            payload: payload,
            seq: nil,
            stateversion: nil)

        await VoiceWakeGlobalSettingsSync.shared.handle(push: .event(evt))

        let updated = await MainActor.run { AppStateStore.shared.swabbleTriggerWords }
        #expect(updated == ["before"])

        await MainActor.run {
            AppStateStore.shared.applyGlobalVoiceWakeTriggers(previous)
        }
    }
}
