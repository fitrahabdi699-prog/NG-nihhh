import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NG-FILM & SERIES',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.redAccent),
        useMaterial3: true,
      ),
      home: const NgFilmSeriesApp(),
    );
  }
}

class NgFilmSeriesApp extends StatefulWidget {
  const NgFilmSeriesApp({super.key});

  @override
  State<NgFilmSeriesApp> createState() => _NgFilmSeriesAppState();
}

class _NgFilmSeriesAppState extends State<NgFilmSeriesApp> {
  int _tabIndex = 0;

  final _tabs = const [
    _HomePage(),
    _MoviesTvPage(type: 'movie'),
    _MoviesTvPage(type: 'tv'),
    _WatchlistPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        titleSpacing: 12,
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset('assets/logo.png', width: 32, height: 32, fit: BoxFit.cover),
            ),
            const SizedBox(width: 10),
            const Text('NG-FILM & SERIES'),
          ],
        ),
      ),
      body: _tabs[_tabIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (i) => setState(() => _tabIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Beranda'),
          NavigationDestination(icon: Icon(Icons.movie_outlined), label: 'Film'),
          NavigationDestination(icon: Icon(Icons.tv_outlined), label: 'Series'),
          NavigationDestination(icon: Icon(Icons.bookmark_border_outlined), label: 'Watchlist'),
        ],
      ),
    );
  }
}

class _HomePage extends StatelessWidget {
  const _HomePage();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Trending & rekomendasi',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        const Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Text('MVP versi Flutter: Home/Film/Series/Watchlist sudah siap.\n\nLangkah berikutnya: integrasi TMDB + player.'),
          ),
        ),
      ],
    );
  }
}

class _MoviesTvPage extends StatelessWidget {
  final String type; // 'movie' | 'tv'
  const _MoviesTvPage({required this.type});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          type == 'movie' ? 'Semua Film' : 'Semua Series',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        const Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Text('Belum ada data TMDB (akan di-implementasi).'),
          ),
        ),
      ],
    );
  }
}

class _WatchlistPage extends StatelessWidget {
  const _WatchlistPage();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Watchlist',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        const Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Text('Watchlist MVP belum tersimpan. Akan diimplementasi dengan shared_preferences.'),
          ),
        ),
      ],
    );
  }
}

