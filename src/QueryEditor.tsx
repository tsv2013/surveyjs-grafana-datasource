import defaults from 'lodash/defaults';

import React, { ChangeEvent, useEffect, useState } from 'react';
import { LegacyForms } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, SurveyJSDataSourceOptions, SurveyJSQuery } from './types';

const { FormField, Select } = LegacyForms;

type Props = QueryEditorProps<DataSource, SurveyJSQuery, SurveyJSDataSourceOptions>;

export const QueryEditor: React.FC<Props> = ({ query, onChange, onRunQuery, datasource }) => {
  const onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, queryText: event.target.value });
    // executes the query
    onRunQuery();
  };

  const onQuestionIdChange = (selected: SelectableValue<string>) => {
    onChange({ ...query, questionId: selected?.value || '' });
    // executes the query
    onRunQuery();
  };


  const defaultsQuery = defaults(query, defaultQuery);
  const { queryText, questionId } = defaultsQuery as SurveyJSQuery;

  const [questions, setQuestions] = useState<SelectableValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        const questions = await datasource.getQuestions();
        if (isMounted) {
          setQuestions(questions);
        }
      } catch (error) {
        console.error('Failed to fetch services', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      isMounted = false;
    };
  }, [datasource]);

  return (
    <div className="gf-form">
      <Select
        options={questions}
        value={questions.find(s => s.value === questionId)}
        onChange={onQuestionIdChange}
        isLoading={isLoading}
        width={24}
        isClearable={true}
        placeholder='The question to query.'
      />
      <FormField
        labelWidth={8}
        value={queryText || ''}
        onChange={onQueryTextChange}
        label="Query Text"
        tooltip="Not used yet"
      />
    </div>
  );
  
}
