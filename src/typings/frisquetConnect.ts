export type SiteResponse = {
  environnement: {
    T_EXT?: number;
  };
  zones: Zone[];
};

export type Zone = {
  boost_disponible: boolean;
  id: number;
  identifiant: string;
  numero: number;
  nom: string;
  carac_zone: {
    MODE: number;
    SELECTEUR: number;
    TAMB: number;
    CAMB: number;
    DERO: boolean;
    CONS_RED: number;
    CONS_CONF: number;
    CONS_HG: number;
    ACTIVITE_BOOST: boolean;
  };
  programmation: [unknown];
};
