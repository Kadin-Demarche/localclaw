import Foundation

public enum LocalClawCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum LocalClawCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum LocalClawCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum LocalClawCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct LocalClawCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: LocalClawCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: LocalClawCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: LocalClawCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: LocalClawCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct LocalClawCameraClipParams: Codable, Sendable, Equatable {
    public var facing: LocalClawCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: LocalClawCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: LocalClawCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: LocalClawCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
