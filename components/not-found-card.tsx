const HOME_URL = "https://smesummit.vn";

export function NotFoundCard() {
  return (
    <main className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <div className="not-found-visual" aria-hidden="true">
          <div className="not-found-glass">
            <div className="not-found-soft not-found-soft-left" />
            <div className="not-found-soft not-found-soft-right" />
            <div className="not-found-number-row">
              <span>4</span>
              <span>0</span>
              <span>4</span>
            </div>
          </div>
        </div>

        <h1 id="not-found-title">Kh&#244;ng t&#236;m th&#7845;y trang</h1>
        <p className="not-found-copy">
          Li&#234;n k&#7871;t b&#7841;n truy c&#7853;p kh&#244;ng t&#7891;n t&#7841;i ho&#7863;c &#273;&#227; &#273;&#432;&#7907;c c&#7853;p nh&#7853;t.
        </p>

        <a className="not-found-home" href={HOME_URL}>
          Quay l&#7841;i trang ch&#7911;
        </a>
      </section>
    </main>
  );
}