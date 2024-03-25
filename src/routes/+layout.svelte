<div class="container">
 <slot></slot>
</div>

<style>
.container {
    padding-top: 20px;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    max-height: 100vh;
    overflow-y: auto;
    width: 100%;
    display: flex;
}
</style>