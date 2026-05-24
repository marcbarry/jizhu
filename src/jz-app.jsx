// App shell — wires routing to screens

function App() {
  const { route } = useRoute();
  const { deck } = useStore();

  // If a route requires a deck and there isn't one, redirect to home.
  React.useEffect(() => {
    if (!deck && (route === 'deck' || route === 'review' || route === 'stats')) {
      window.location.hash = 'home';
    }
  }, [deck, route]);

  let screen;
  switch (route) {
    case 'home':     screen = <Home />;         break;
    case 'deck':     screen = <DeckLanding />;  break;
    case 'review':   screen = <ReviewScreen />; break;
    case 'settings': screen = <Settings />;     break;
    case 'stats':    screen = <Stats />;        break;
    default:         screen = <Home />;
  }

  return (
    <div className="canvas-pad">
      <div className="phone-mount">
        {screen}
      </div>
    </div>
  );
}

function Root() {
  return (
    <RouterProvider>
      <JzProvider>
        <App />
      </JzProvider>
    </RouterProvider>
  );
}

Object.assign(window, { App, Root });
