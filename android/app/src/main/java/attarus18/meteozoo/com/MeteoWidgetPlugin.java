package attarus18.meteozoo.com;

import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Passa al widget della schermata home i dati che conosce solo l'app web:
 * posizione, animale scelto con le sue frasi, etichette delle scene e,
 * se disponibile, il meteo appena scaricato. Vedi src/lib/widget.ts.
 */
@CapacitorPlugin(name = "MeteoWidget")
public class MeteoWidgetPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        SharedPreferences.Editor e = MeteoWidgetProvider.prefs(getContext()).edit();
        if (call.hasOption("lat") && call.hasOption("lon")) {
            e.putFloat("lat", call.getFloat("lat", 0f)).putFloat("lon", call.getFloat("lon", 0f));
        }
        putString(e, call, "city");
        putString(e, call, "animal");
        putString(e, call, "phrases");
        putString(e, call, "labels");
        JSObject weather = call.getObject("weather");
        if (weather != null) {
            e.putFloat("temp", (float) weather.optDouble("temp", 0))
                .putFloat("min", (float) weather.optDouble("min", 0))
                .putFloat("max", (float) weather.optDouble("max", 0))
                .putString("cond", weather.getString("cond"))
                .putLong("updatedAt", System.currentTimeMillis());
        }
        e.apply();
        MeteoWidgetProvider.renderAll(getContext());
        call.resolve();
    }

    private static void putString(SharedPreferences.Editor e, PluginCall call, String key) {
        String value = call.getString(key);
        if (value != null) e.putString(key, value);
    }
}
