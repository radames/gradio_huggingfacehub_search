import gradio as gr
from gradio_huggingfacehub_search import HuggingfaceHubSearch


example = HuggingfaceHubSearch().example_value()


def predict(hub_repo_id):
    print("hub_repo_id", hub_repo_id)
    return hub_repo_id


with gr.Blocks() as demo:
    with gr.Row():
        with gr.Column():
            search_in = HuggingfaceHubSearch(
                label="Search Huggingface Hub",
                placeholder="Search for models on Huggingface",
                search_type="model",
            )
            btn = gr.Button("Run")
        with gr.Column():
            search_out = HuggingfaceHubSearch(label="Search Huggingface Hub")
    gr.on(
        [btn.click, search_in.submit],
        fn=predict,
        inputs=[search_in],
        outputs=[search_out],
    )


if __name__ == "__main__":
    demo.launch()
