import faunadb, { query as q } from 'faunadb';

export default class FaunaCache {
  constructor(props) {
    this.props = {
      ttl: 300,
      collection: 'httpcache',
      ...props,
    };

    this.db = new faunadb.Client({
      secret: this.props.secret,
    });

    this.indexName = `${this.props.collection}_key`;
  }

  async stage() {
    await this.db.query(
      q.If(
        q.Not(q.Exists(q.Collection(this.props.collection))),
        q.CreateCollection({ name: this.props.collection }),
        true,
      ),
    );

    await this.db.query(
      q.If(
        q.Not(q.Exists(q.Index(this.indexName))),
        q.CreateIndex({
          name: this.indexName,
          source: q.Collection(this.props.collection),
          terms: [
            { field: ['data', 'key'] },
          ],
        }),
        true,
      ),
    );
  }

  unstage() {
    return this.db.query([
      q.If(
        q.Exists(q.Collection(this.props.collection)),
        q.Delete(q.Collection(this.props.collection)),
        null,
      ),
      q.If(
        q.Exists(q.Index(this.indexName)),
        q.Delete(q.Index(this.indexName)),
        null,
      ),
    ]);
  }

  async set(key, value, options) {
    const { ttl } = {
      ...this.props,
      ...options,
    };
    await this.db.query(
      q.Let(
        { ref: q.Match(q.Index(this.indexName), key) },
        q.If(
          q.IsNonEmpty(q.Var('ref')),
          q.Update(q.Select(['ref'], q.Get(q.Var('ref'))), { data: { value } }),
          q.Create(q.Collection(this.props.collection), { data: { value, key }, ttl: q.TimeAdd(q.Now(), ttl, 'milliseconds') }),
        ),
      ),
    );
  }

  async get(key) {
    const r = await this.db.query(
      q.Let(
        { ref: q.Match(q.Index(this.indexName), key) },
        q.If(
          q.IsNonEmpty(q.Var('ref')),
          q.Get(q.Var('ref')),
          null,
        ),
      ),
    );
    return r?.data?.value;
  }

  delete(key) {
    return this.db.query(
      q.Let(
        { ref: q.Match(q.Index(this.indexName), key) },
        q.If(
          q.IsNonEmpty(q.Var('ref')),
          q.Delete(q.Var('ref')),
          null,
        ),
      ),
    );
  }
}
