import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client";
import { GET_MY_TODOS } from "./TodoPrivateList";

const ADD_TODO = gql`
  mutation ($todo: String!, $isPublic: Boolean!) {
    insert_todos(objects: { title: $todo, is_public: $isPublic }) {
      affected_rows
      returning {
        id
        title
        created_at
        is_completed
      }
    }
  }
`;

const TodoInput = ({ isPublic = false }) => {
  const [todoInput, setTodoInput] = useState("");

  //data - result of mutation, cache- current cache
  const updateCache = (cache, { data }) => {
    // If this is for the public feed, do nothing
    if (isPublic) {
      return null;
    }
    // Fetch the todos from the cache
    //Unlike client.query, readQuery will never make a request to your GraphQL server.
    //It will always read from the cache.
    const existingTodos = cache.readQuery({
      query: GET_MY_TODOS,
    });
    // Add the new todo to the cache
    const newTodo = data.insert_todos.returning[0];

    //We concatenate our new todo from our mutation with the list of existing todos
    // and write the query back to the cache with cache.writeQuery
    cache.writeQuery({
      query: GET_MY_TODOS,
      data: { todos: [newTodo, ...existingTodos.todos] },
    });
  };

  const resetInput = () => {
    setTodoInput("");
  };

  //addTodo is the mutate function
  //Unlike useQuery, useMutation doesn't execute its operation automatically on render.
  //Instead, you call this mutate function.
  const [addTodo] = useMutation(ADD_TODO, {
    update: updateCache,
    onCompleted: resetInput,
  });

  return (
    <form
      className="formInput"
      onSubmit={(e) => {
        e.preventDefault();
        addTodo({ variables: { todo: todoInput, isPublic } });
      }}
    >
      <input
        className="input"
        placeholder="What needs to be done?"
        value={todoInput}
        onChange={(e) => setTodoInput(e.target.value)}
      />
      <i className="inputMarker fa fa-angle-right" />
    </form>
  );
};

export default TodoInput;
