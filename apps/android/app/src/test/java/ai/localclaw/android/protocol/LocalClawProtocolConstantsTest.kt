package ai.localclaw.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class LocalClawProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", LocalClawCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", LocalClawCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", LocalClawCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", LocalClawCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", LocalClawCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", LocalClawCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", LocalClawCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", LocalClawCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", LocalClawCapability.Canvas.rawValue)
    assertEquals("camera", LocalClawCapability.Camera.rawValue)
    assertEquals("screen", LocalClawCapability.Screen.rawValue)
    assertEquals("voiceWake", LocalClawCapability.VoiceWake.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", LocalClawScreenCommand.Record.rawValue)
  }
}
