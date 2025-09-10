package config

type AppConfig struct {
	Port        string `env:"PORT" envDefault:": "8080"`
	DatabaseURL string `env:"DATABASE_URL" envDefault:"postgres://user:password@localhost:5432/mydb"`
	LogLevel    string `env:"LOG_LEVEL" envDefault:"info`
}

func GetAppConfigFromEnv() (*AppConfig, error) {
	var config AppConfig
	config.Port = "8089"
	return &config, nil
}
