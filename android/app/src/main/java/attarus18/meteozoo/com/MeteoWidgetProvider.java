package attarus18.meteozoo.com;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.widget.RemoteViews;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Widget "Meteo Zoo": l'animale scelto vestito per il meteo attuale, con
 * temperatura, citta' e la sua frase.
 *
 * I dati arrivano da due parti:
 * - dall'app (MeteoWidgetPlugin): posizione, animale, frasi ed etichette, e il
 *   meteo appena scaricato, cosi' il widget si aggiorna subito;
 * - da qui, ogni ~30 minuti (updatePeriodMillis), scaricando il meteo attuale
 *   dal ponte del sito (la chiave OpenWeatherMap resta sul server).
 * La scelta della scena replica pickCondition di src/lib/conditions.ts.
 */
public class MeteoWidgetProvider extends AppWidgetProvider {

    static final String PREFS = "meteozoo_widget";
    private static final String API = "https://meteo-zoo.vercel.app/api/meteo/";
    /** Sotto questo intervallo non si riscarica il meteo (il ponte ha comunque la cache). */
    private static final long MIN_REFRESH_MS = 20 * 60 * 1000;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        renderAll(context);
        SharedPreferences p = prefs(context);
        if (!p.contains("lat") || System.currentTimeMillis() - p.getLong("updatedAt", 0) < MIN_REFRESH_MS) return;
        final PendingResult pending = goAsync();
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                fetchWeather(context);
                renderAll(context);
            } catch (Exception ignored) {
                // offline: resta l'ultimo meteo mostrato
            } finally {
                pending.finish();
            }
        });
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Ridisegna tutti i widget presenti nella schermata home. */
    static void renderAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, MeteoWidgetProvider.class));
        if (ids.length == 0) return;
        RemoteViews views = build(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    private static RemoteViews build(Context context) {
        SharedPreferences p = prefs(context);
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.meteo_widget);

        Intent open = new Intent(context, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        v.setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));

        String animal = p.getString("animal", "pollo");
        String cond = p.getString("cond", null);
        if (cond == null) {
            // Ancora nessun meteo: invito ad aprire l'app.
            v.setInt(R.id.widget_root, "setBackgroundResource", background("sole"));
            setAnimal(context, v, animal, "sole");
            v.setTextViewText(R.id.widget_city, "Meteo Zoo");
            v.setTextViewText(R.id.widget_temp, "");
            v.setTextViewText(R.id.widget_label, "");
            v.setTextViewText(R.id.widget_phrase, "Apri l'app per vedere il meteo della tua zona.");
            return v;
        }

        v.setInt(R.id.widget_root, "setBackgroundResource", background(cond));
        setAnimal(context, v, animal, cond);
        v.setTextViewText(R.id.widget_city, p.getString("city", ""));
        v.setTextViewText(R.id.widget_temp, Math.round(p.getFloat("temp", 0)) + "°");
        String range = "max " + Math.round(p.getFloat("max", 0)) + "° · min " + Math.round(p.getFloat("min", 0)) + "°";
        v.setTextViewText(R.id.widget_label, label(p, cond) + "  ·  " + range);
        v.setTextViewText(R.id.widget_phrase, phrase(p, animal, cond));
        return v;
    }

    private static void setAnimal(Context context, RemoteViews v, String animal, String cond) {
        Bitmap bmp = loadAnimal(context, animal, cond);
        if (bmp == null) bmp = loadAnimal(context, animal, "sole");
        if (bmp == null) bmp = loadAnimal(context, "pollo", "sole");
        if (bmp != null) v.setImageViewBitmap(R.id.widget_animal, bmp);
    }

    /** Le illustrazioni sono negli asset del sito impacchettato (webp 512px), ridotte per il widget. */
    private static Bitmap loadAnimal(Context context, String animal, String cond) {
        try (InputStream in = context.getAssets().open("public/animali/" + animal + "/" + cond + ".webp")) {
            Bitmap full = BitmapFactory.decodeStream(in);
            if (full == null) return null;
            return Bitmap.createScaledBitmap(full, 280, 280, true);
        } catch (Exception e) {
            return null;
        }
    }

    private static String label(SharedPreferences p, String cond) {
        try {
            return new JSONObject(p.getString("labels", "{}")).optString(cond, cond);
        } catch (Exception e) {
            return cond;
        }
    }

    /** Una frase dell'animale per quella scena, la stessa per tutto il giorno. */
    private static String phrase(SharedPreferences p, String animal, String cond) {
        try {
            JSONArray list = new JSONObject(p.getString("phrases", "{}")).optJSONArray(cond);
            if (list == null || list.length() == 0) return "";
            String day = new SimpleDateFormat("yyyyMMdd", Locale.ROOT).format(new Date());
            int i = Math.abs((animal + cond + day).hashCode()) % list.length();
            return "«" + list.getString(i) + "»";
        } catch (Exception e) {
            return "";
        }
    }

    private static int background(String cond) {
        switch (cond) {
            case "notte": return R.drawable.widget_bg_notte;
            case "nuvoloso": return R.drawable.widget_bg_nuvoloso;
            case "pioggia": return R.drawable.widget_bg_pioggia;
            case "temporale": return R.drawable.widget_bg_temporale;
            case "neve": return R.drawable.widget_bg_neve;
            case "nebbia": return R.drawable.widget_bg_nebbia;
            case "vento": return R.drawable.widget_bg_vento;
            case "caldo": return R.drawable.widget_bg_caldo;
            case "freddo": return R.drawable.widget_bg_freddo;
            default: return R.drawable.widget_bg_sole;
        }
    }

    /** Scarica il meteo attuale dal ponte e lo salva (stessa logica di pickCondition). */
    private static void fetchWeather(Context context) throws Exception {
        SharedPreferences p = prefs(context);
        String url = String.format(Locale.ROOT, "%s?tipo=attuale&lat=%.2f&lon=%.2f", API, p.getFloat("lat", 0), p.getFloat("lon", 0));
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(6000);
        c.setReadTimeout(6000);
        try {
            if (c.getResponseCode() != 200) return;
            StringBuilder sb = new StringBuilder();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"))) {
                String line;
                while ((line = r.readLine()) != null) sb.append(line);
            }
            JSONObject j = new JSONObject(sb.toString());
            JSONObject w = j.getJSONArray("weather").getJSONObject(0);
            JSONObject main = j.getJSONObject("main");
            JSONObject wind = j.optJSONObject("wind");
            double temp = main.getDouble("temp");
            String cond = pickCondition(
                w.getInt("id"),
                w.optString("icon", "01d"),
                temp,
                wind != null ? wind.optDouble("speed", 0) : 0,
                wind != null ? wind.optDouble("gust", 0) : 0
            );
            SharedPreferences.Editor e = p.edit()
                .putFloat("temp", (float) temp)
                .putFloat("min", (float) main.optDouble("temp_min", temp))
                .putFloat("max", (float) main.optDouble("temp_max", temp))
                .putString("cond", cond)
                .putLong("updatedAt", System.currentTimeMillis());
            String name = j.optString("name", "");
            if (!name.isEmpty() && !p.getBoolean("cityFixed", false)) e.putString("city", name);
            e.apply();
        } finally {
            c.disconnect();
        }
    }

    /** Porting di pickCondition (src/lib/conditions.ts): tenere allineate le soglie. */
    static String pickCondition(int id, String icon, double temp, double windMs, double gustMs) {
        boolean night = icon.endsWith("n");
        double windKmh = Math.max(windMs, gustMs * 0.7) * 3.6;
        if (id >= 200 && id < 300) return "temporale";
        if (id >= 600 && id < 700) return "neve";
        if ((id >= 300 && id < 400) || (id >= 500 && id < 600)) return "pioggia";
        if (id == 781 || id == 771) return "vento";
        if (id >= 700 && id < 800) return "nebbia";
        if (Math.round(windKmh) >= 38) return "vento";
        if (temp >= 32 && !night) return "caldo";
        if (temp <= 0) return "freddo";
        if (id == 800 || id == 801) return night ? "notte" : "sole";
        return "nuvoloso";
    }
}
