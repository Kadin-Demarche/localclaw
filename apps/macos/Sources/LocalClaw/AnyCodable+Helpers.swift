import LocalClawKit
import LocalClawProtocol
import Foundation

// Prefer the LocalClawKit wrapper to keep gateway request payloads consistent.
typealias AnyCodable = LocalClawKit.AnyCodable
typealias InstanceIdentity = LocalClawKit.InstanceIdentity

extension AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: AnyCodable]? { self.value as? [String: AnyCodable] }
    var arrayValue: [AnyCodable]? { self.value as? [AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}

extension LocalClawProtocol.AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: LocalClawProtocol.AnyCodable]? { self.value as? [String: LocalClawProtocol.AnyCodable] }
    var arrayValue: [LocalClawProtocol.AnyCodable]? { self.value as? [LocalClawProtocol.AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: LocalClawProtocol.AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [LocalClawProtocol.AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}
