// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "LocalClawKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "LocalClawProtocol", targets: ["LocalClawProtocol"]),
        .library(name: "LocalClawKit", targets: ["LocalClawKit"]),
        .library(name: "LocalClawChatUI", targets: ["LocalClawChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "LocalClawProtocol",
            path: "Sources/LocalClawProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "LocalClawKit",
            dependencies: [
                "LocalClawProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/LocalClawKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "LocalClawChatUI",
            dependencies: [
                "LocalClawKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/LocalClawChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "LocalClawKitTests",
            dependencies: ["LocalClawKit", "LocalClawChatUI"],
            path: "Tests/LocalClawKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
