package com.mithaiworld.app;

import android.os.Bundle;
import android.util.Log;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.ionicframework.capacitor.Checkout;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.d("MithaiWorldStartup", "NATIVE_LAUNCH_MS: " + System.currentTimeMillis());
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        registerPlugin(Checkout.class);
    }
}
