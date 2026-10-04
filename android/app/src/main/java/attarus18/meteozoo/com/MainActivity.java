package attarus18.meteozoo.com;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // I plugin locali vanno registrati prima di super.onCreate.
        registerPlugin(LayoutInsetsPlugin.class);
        super.onCreate(savedInstanceState);
        enterFullscreen();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Dopo dialog di sistema, permessi o ritorno dall'app riappaiono le barre: si rinascondono.
        if (hasFocus) enterFullscreen();
    }

    /**
     * Schermo intero (immersive): niente barra di stato ne' barra di navigazione.
     * Scorrendo dal bordo riappaiono per qualche secondo, sopra l'app.
     */
    private void enterFullscreen() {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }
}
