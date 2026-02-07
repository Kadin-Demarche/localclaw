import Foundation

public enum LocalClawLocationMode: String, Codable, Sendable, CaseIterable {
    case off
    case whileUsing
    case always
}
