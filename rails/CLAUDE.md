# rails 開発ルール

rails(API)の実装・レビュー時に守るルール。

## request spec のログインはログイン API 経由で行う

request spec では `sign_in` / `login_as`(Devise・Warden のテストヘルパー)を使わない。ログイン API(`POST /api/v1/user/login`)を叩き、返ってきた Cookie を後続のリクエストに付けてログインする。

- **理由**: テスト環境では Bullet を有効にしており、N+1 を検知するとテストが落ちる(`config/environments/test.rb`)。`sign_in` / `login_as` はテストで作ったユーザーのインスタンスをそのまま `current_user` にするため、`current_user.high_school.grades` のような「`current_user` の `belongs_to` の先の `has_many`」を N+1 と誤検知する。ログイン API 経由なら `current_user` はリクエスト内で読み込み直されるので、誤検知しない。
- **誤検知を避けるためにアプリ側のコードを変えない**: `sign_in` で落ちたときに `includes` を足したり、`current_user` を起点にしない書き方へ変えたりしない。spec 側をログイン API 経由に直す。

### 書き方

```ruby
let(:headers) do
  {
    'Content-Type' => 'application/json',
    'Accept' => 'application/json'
  }
end

def login_and_get_cookie(user)
  post '/api/v1/user/login',
       params: { email: user.email, password: 'password' }.to_json,
       headers: headers

  response.headers['Set-Cookie']&.split(';')&.first
end

let!(:cookie) { login_and_get_cookie(user) }

it '...' do
  get '/api/v1/addresses', headers: headers.merge('Cookie' => cookie)
end
```

既存の例: `spec/requests/api/v1/addresses_spec.rb`

## Bullet(N+1 検知)の注意点

- 検知は Bullet の Rack ミドルウェアがリクエストごとに行う。テスト内で作ったレコードは対象外になるため、request spec 以外(model・service・job)と、1 リクエストで 1 件しか読み込まない例では検知しない。N+1 を確かめたい request spec では、複数件のレコードを作る。
- safelist を追加するときは `config/environments/test.rb` の `Bullet.enable = true` より後に書く。`enable=` が safelist を空に戻すため。
