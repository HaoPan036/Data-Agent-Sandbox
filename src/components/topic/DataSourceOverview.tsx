import type { Topic } from "../../topics/topicTypes";

interface DataSourceOverviewProps {
  topic: Topic;
}

export function DataSourceOverview({ topic }: DataSourceOverviewProps) {
  return (
    <section className="panel" id="data-sources">
      <div className="panel__heading">
        <h2>Data Source Overview</h2>
        <span className="muted">{topic.dataSources.length} sources</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Freshness</th>
              <th>Rows</th>
            </tr>
          </thead>
          <tbody>
            {topic.dataSources.map((source) => (
              <tr key={source.id}>
                <td>
                  <strong>{source.name}</strong>
                  <span>{source.description}</span>
                </td>
                <td>{source.sourceType}</td>
                <td>{source.freshness}</td>
                <td>{source.rowCountLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

