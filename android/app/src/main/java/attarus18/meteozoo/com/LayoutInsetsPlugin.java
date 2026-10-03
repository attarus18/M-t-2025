package attarus18.meteozoo.com;

import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Misura dove stanno davvero il banner AdMob e la barra di sistema rispetto alla
 * WebView. Su Android 15+ (edge-to-edge) il plugin AdMob sposta il banner sopra
 * la barra dei gesti, e la WebView puo' finirci sotto: senza queste misure la
 * navbar dell'app verrebbe coperta. Misura anche il notch in alto (app a schermo intero). Valori in dp (= px CSS), dal fondo della WebView.
 */
@CapacitorPlugin(name = "LayoutInsets")
public class LayoutInsetsPlugin extends Plugin {

    @PluginMethod
    public void measure(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            WebView webView = getBridge().getWebView();
            View decor = getActivity().getWindow().getDecorView();
            float density = getActivity().getResources().getDisplayMetrics().density;

            int[] loc = new int[2];
            webView.getLocationOnScreen(loc);
            int webBottom = loc[1] + webView.getHeight();

            // Quanta WebView finisce sotto la barra di navigazione di sistema.
            int navInset = 0;
            WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decor);
            if (insets != null) {
                navInset = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            }
            decor.getLocationOnScreen(loc);
            int systemBarTop = loc[1] + decor.getHeight() - navInset;
            int navOverlap = Math.max(0, webBottom - systemBarTop);

            // Banner AdMob visibile: spazio da lasciare sopra (adTop) e striscia sotto (adBottom).
            int adTop = 0;
            int adBottom = 0;
            View ad = findAdView(decor);
            if (ad != null && ad.isShown() && ad.getHeight() > 0) {
                ad.getLocationOnScreen(loc);
                adTop = Math.max(0, webBottom - loc[1]);
                adBottom = Math.max(0, webBottom - (loc[1] + ad.getHeight()));
            }

            // Notch / foro della fotocamera (e barra di stato se visibile) sopra la WebView.
            int safeTop = 0;
            if (insets != null) {
                int cutoutTop = insets.getInsets(WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.statusBars()).top;
                webView.getLocationOnScreen(loc);
                int webTop = loc[1];
                decor.getLocationOnScreen(loc);
                safeTop = Math.max(0, loc[1] + cutoutTop - webTop);
            }

            JSObject ret = new JSObject();
            ret.put("safeTop", Math.round(safeTop / density));
            ret.put("adTop", Math.round(adTop / density));
            ret.put("adBottom", Math.round(adBottom / density));
            ret.put("navOverlap", Math.round(navOverlap / density));
            call.resolve(ret);
        });
    }

    private static View findAdView(View view) {
        if (view.getClass().getName().equals("com.google.android.gms.ads.AdView")) return view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                View found = findAdView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }
}
