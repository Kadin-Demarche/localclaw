import Foundation
import Testing
@testable import LocalClaw

@Suite(.serialized)
struct LocalClawConfigFileTests {
    @Test
    func configPathRespectsEnvOverride() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("localclaw-config-\(UUID().uuidString)")
            .appendingPathComponent("localclaw.json")
            .path

        await TestIsolation.withEnvValues(["LOCALCLAW_CONFIG_PATH": override]) {
            #expect(LocalClawConfigFile.url().path == override)
        }
    }

    @MainActor
    @Test
    func remoteGatewayPortParsesAndMatchesHost() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("localclaw-config-\(UUID().uuidString)")
            .appendingPathComponent("localclaw.json")
            .path

        await TestIsolation.withEnvValues(["LOCALCLAW_CONFIG_PATH": override]) {
            LocalClawConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "ws://gateway.ts.net:19999",
                    ],
                ],
            ])
            #expect(LocalClawConfigFile.remoteGatewayPort() == 19999)
            #expect(LocalClawConfigFile.remoteGatewayPort(matchingHost: "gateway.ts.net") == 19999)
            #expect(LocalClawConfigFile.remoteGatewayPort(matchingHost: "gateway") == 19999)
            #expect(LocalClawConfigFile.remoteGatewayPort(matchingHost: "other.ts.net") == nil)
        }
    }

    @MainActor
    @Test
    func setRemoteGatewayUrlPreservesScheme() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("localclaw-config-\(UUID().uuidString)")
            .appendingPathComponent("localclaw.json")
            .path

        await TestIsolation.withEnvValues(["LOCALCLAW_CONFIG_PATH": override]) {
            LocalClawConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            LocalClawConfigFile.setRemoteGatewayUrl(host: "new-host", port: 2222)
            let root = LocalClawConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "wss://new-host:2222")
        }
    }

    @Test
    func stateDirOverrideSetsConfigPath() async {
        let dir = FileManager().temporaryDirectory
            .appendingPathComponent("localclaw-state-\(UUID().uuidString)", isDirectory: true)
            .path

        await TestIsolation.withEnvValues([
            "LOCALCLAW_CONFIG_PATH": nil,
            "LOCALCLAW_STATE_DIR": dir,
        ]) {
            #expect(LocalClawConfigFile.stateDirURL().path == dir)
            #expect(LocalClawConfigFile.url().path == "\(dir)/localclaw.json")
        }
    }
}
