package com.example.roadbuddy

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.presagetech.smartspectra.SmartSpectraView
import com.presagetech.smartspectra.SmartSpectraSdk

class MainActivity : AppCompatActivity() {
    private lateinit var smartSpectraView: SmartSpectraView

    // Replace with your API key from https://physiology.presagetech.com
    private val smartSpectraSdk = SmartSpectraSdk.getInstance().apply {
        setApiKey("us3FiOqzMByIPAxFlBNM9WwQlPDINUG1STdcp191")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        smartSpectraView = findViewById(R.id.smart_spectra_view)
    }
}
