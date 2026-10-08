package attarus18.meteozoo.com;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.Executors;

/**
 * Passa al widget della schermata home i dati che conosce solo l'app web:
 * posizione, animale scelto con le sue frasi, etichette delle scene e,
 * se disponibile, il meteo appena scaricato. Vedi src/lib/widget.ts.
 * Se il widget ha una posizione ma non il meteo (o e' vecchio), lo scarica subito.
 */
@CapacitorPlugin(name = "MeteoWidget")
public class MeteoWidgetPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        Context context = getContext();
        try {
            SharedPreferences p = MeteoWidgetProvider.prefs(context);
            SharedPreferences.Editor e = p.edit();
            JSObject data = call.getData();
            if (data.has("lat") && data.has("lon")) {
                e.putFloat("lat", (float) data.optDouble("lat", 0)).putFloat("lon", (float) data.optDouble("lon", 0));
            }
            putString(e, data, "city");
            putString(e, data, "animal");
            putString(e, data, "phrases");
            putString(e, data, "labels");
            JSObject weather = call.getObject("weather");
            if (weather != null) {
                e.putFloat("temp", (float) weather.optDouble("temp", 0))
                    .putFloat("min", (float) weather.optDouble("min", 0))
                    .putFloat("max", (float) weather.optDouble("max", 0))
                    .putString("cond", weather.optString("cond", "sole"))
                    .putLong("updatedAt", System.currentTimeMillis());
            }
            e.commit();
            MeteoWidgetProvider.renderAll(context);

            // Nessun meteo dall'app ma posizione nota: il widget se lo scarica da solo.
            if (weather == null && MeteoWidgetProvider.needsRefresh(p)) {
                Executors.newSingleThreadExecutor().execute(() -> {
                    try {
                        MeteoWidgetProvider.fetchWeather(context);
                        MeteoWidgetProvider.renderAll(context);
                    } catch (Exception ignored) {
                        // offline: resta l'ultimo meteo mostrato
                    }
                });
            }
        } catch (Exception ignored) {
            // il widget non deve mai far fallire l'app
        }
        call.resolve();
    }

    private static void putString(SharedPreferences.Editor e, JSObject data, String key) {
        if (data.has(key)) e.putString(key, data.optString(key));
    }
}
