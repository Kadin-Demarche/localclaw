// swift-tools-version: 6.2
// Package manifest for the LocalClaw macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "LocalClaw",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "LocalClawIPC", targets: ["LocalClawIPC"]),
        .library(name: "LocalClawDiscovery", targets: ["LocalClawDiscovery"]),
        .executable(name: "LocalClaw", targets: ["LocalClaw"]),
        .executable(name: "localclaw-mac", targets: ["LocalClawMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/LocalClawKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "LocalClawIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "LocalClawDiscovery",
            dependencies: [
                .product(name: "LocalClawKit", package: "LocalClawKit"),
            ],
            path: "Sources/LocalClawDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "LocalClaw",
            dependencies: [
                "LocalClawIPC",
                "LocalClawDiscovery",
                .product(name: "LocalClawKit", package: "LocalClawKit"),
                .product(name: "LocalClawChatUI", package: "LocalClawKit"),
                .product(name: "LocalClawProtocol", package: "LocalClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/LocalClaw.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "LocalClawMacCLI",
            dependencies: [
                "LocalClawDiscovery",
                .product(name: "LocalClawKit", package: "LocalClawKit"),
                .product(name: "LocalClawProtocol", package: "LocalClawKit"),
            ],
            path: "Sources/LocalClawMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "LocalClawIPCTests",
            dependencies: [
                "LocalClawIPC",
                "LocalClaw",
                "LocalClawDiscovery",
                .product(name: "LocalClawProtocol", package: "LocalClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
