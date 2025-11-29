package com.example.budget

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import tools.fastlane.screengrab.Screengrab
import tools.fastlane.screengrab.UiAutomatorScreenshotStrategy
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import android.os.SystemClock

@RunWith(AndroidJUnit4::class)
class ExampleInstrumentedTest {
    @Test
    fun useAppContext() {
        val appContext = InstrumentationRegistry.getInstrumentation().targetContext
        assertEquals("com.example.budget", appContext.packageName)
    }

    @Test
    fun captureScreenshots() {
        Screengrab.setDefaultScreenshotStrategy(UiAutomatorScreenshotStrategy())
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        SystemClock.sleep(2000)
        Screengrab.screenshot("01_auth_login")

        val signup = device.findObject(By.textContains("Inscrire"))
        signup?.click()
        device.wait(Until.hasObject(By.textContains("Email")), 3000)
        Screengrab.screenshot("02_auth_signup")

        val demo = device.findObject(By.textContains("Demo"))
        demo?.click()
        SystemClock.sleep(3000)
        Screengrab.screenshot("03_dashboard")

        val transactions = device.findObject(By.textContains("Transactions"))
        transactions?.click()
        SystemClock.sleep(1500)
        Screengrab.screenshot("04_transactions_list")

        val fab = device.findObject(By.descContains("Ajouter"))
        fab?.click()
        SystemClock.sleep(1500)
        Screengrab.screenshot("05_transaction_form")

        val budget = device.findObject(By.textContains("Budget"))
        budget?.click()
        SystemClock.sleep(1500)
        Screengrab.screenshot("06_budget_planner")

        val goals = device.findObject(By.textContains("Objectifs"))
        goals?.click()
        SystemClock.sleep(1500)
        Screengrab.screenshot("07_goals")

        val iou = device.findObject(By.textContains("Dettes"))
        iou?.click()
        SystemClock.sleep(1500)
        Screengrab.screenshot("08_iou")

        val settings = device.findObject(By.descContains("Settings"))
        settings?.click()
        SystemClock.sleep(1500)
        Screengrab.screenshot("09_settings")
    }
}
