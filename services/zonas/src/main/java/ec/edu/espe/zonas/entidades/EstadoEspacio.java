package ec.edu.espe.zonas.entidades;

import java.util.Arrays;
import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum EstadoEspacio {

    DISPONIBLE, OCUPADO, RESERVADO, FUERA_DE_SERVICIO;

    @JsonCreator
    public static EstadoEspacio fromString(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            return null;
        }
        String normalizado = valor.trim().toUpperCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(estado -> estado.name().equals(normalizado))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Estado de espacio invalido: " + valor));
    }
}
