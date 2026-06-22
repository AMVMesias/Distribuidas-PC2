package ec.edu.espe.zonas.entidades;

import java.util.Arrays;
import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TipoZona {
    VIP, REGULAR, INTERNA, EXTERNA, PREFERENCIAL;

    @JsonCreator
    public static TipoZona fromString(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            return null;
        }
        String normalizado = valor.trim().toUpperCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(tipo -> tipo.name().equals(normalizado))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Tipo de zona invalido: " + valor));
    }
}
