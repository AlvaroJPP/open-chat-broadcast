src/
├── components/
│   └── home/
│       ├── HomeLayout.tsx        # compõe tudo (usado pela rota /)
│       ├── HomeHeader.tsx        # logo + Entrar/Cadastrar
│       ├── WelcomeHero.tsx       # ícone grande + título + subtítulo
│       ├── CreateRoomCard.tsx    # botão "Criar sala"
│       ├── JoinRoomCard.tsx      # input + "Entrar na sala"
│       ├── RecentRoomsPanel.tsx  # card "Minhas salas recentes"
│       ├── RecentRoomItem.tsx    # cada linha (ícone, status, data)
│       └── HomeFooter.tsx        # ícones GitHub (AlvaroJPP, ysh-rael) + versão
│
├── services/
│   ├── api.ts                    # chamadas reais: GET/POST /api/rooms...
│   └── rooms-service.ts          # camada usada pelos componentes; decide mock x API
│
├── lib/
│   ├── db-types.ts               # tipos espelhando seus 4 models mongoose
│   ├── config.ts                 # flag USE_MOCK_DATA
│   └── mock-home-data.ts         # mocks no formato dos seus schemas
│
└── routes/
    └── index.tsx                 # rota "/" → renderiza HomeLayout


----
VITE_USE_MOCK_DATA=true/false # Habilita uso de mocka