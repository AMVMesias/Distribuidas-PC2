package ec.edu.espe.zonas.entidades;

import java.util.Arrays;
import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TipoEspacio {
    MOTO,
    AUTO,
    BUS;

    @JsonCreator
    public static TipoEspacio fromString(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            return null;
        }
        String normalizado = valor.trim().toUpperCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(tipo -> tipo.name().equals(normalizado))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Tipo de espacio invalido: " + valor));
    }
}
